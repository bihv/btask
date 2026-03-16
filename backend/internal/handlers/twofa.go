package handlers

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type TwoFAHandler struct {
	db            *gorm.DB
	userRepo      *repository.UserRepository
	totpService   *services.TOTPService
	encryption    *services.EncryptionService
	deviceService *services.DeviceService
	cfg           *config.Config
}

func NewTwoFAHandler(db *gorm.DB, cfg *config.Config) *TwoFAHandler {
	userRepo := repository.NewUserRepository()
	totpService := services.NewTOTPService()
	encryption := services.NewEncryptionService(cfg.EncryptionKey)
	deviceService := services.NewDeviceService(db)

	return &TwoFAHandler{
		db:            db,
		userRepo:      userRepo,
		totpService:   totpService,
		encryption:    encryption,
		deviceService: deviceService,
		cfg:           cfg,
	}
}

type TwoFASetupResponse struct {
	Secret      string `json:"secret"`
	QRCodeURL   string `json:"qrCodeUrl"`
	OTPAuthURL  string `json:"otpauthUrl"`
	AlreadyEnabled bool `json:"alreadyEnabled"`
}

type TwoFASetupRequest struct {
	Code   string `json:"code"`
	Secret string `json:"secret"`
}

type TwoFAVerifyRequest struct {
	Code          string `json:"code"`
	RememberDevice bool  `json:"rememberDevice"`
	Fingerprint   string `json:"fingerprint"`
	DeviceName    string `json:"deviceName"`
}

type TwoFADisableRequest struct {
	Password string `json:"password"`
}

type RegenerateRecoveryCodesRequest struct {
	Password string `json:"password"`
}

// RegenerateRecoveryCodes allows user to generate new recovery codes (replaces old ones)
func (h *TwoFAHandler) RegenerateRecoveryCodes(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req RegenerateRecoveryCodesRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Password == "" {
		return utils.ValidationErrorResponse(c, "Password is required")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	if !user.TwoFactorEnabled {
		return utils.ValidationErrorResponse(c, "2FA is not enabled")
	}

	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, "Incorrect password")
	}

	// Generate new recovery codes
	recoveryCodes := services.GenerateRecoveryCodes()
	hashedCodes := make([]string, len(recoveryCodes))
	for i, code := range recoveryCodes {
		hash, _ := services.HashRecoveryCode(code)
		hashedCodes[i] = hash
	}

	// Replace old codes with new ones
	user.TwoFactorRecoveryCodes = strings.Join(hashedCodes, ",")
	if err := h.userRepo.Update(user); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to regenerate recovery codes")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"recoveryCodes": recoveryCodes,
	})
}

type TwoFAStatusResponse struct {
	Enabled               bool   `json:"enabled"`
	RememberedDevicesCount int   `json:"rememberedDevicesCount"`
}

func (h *TwoFAHandler) GetSetup(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	if user.TwoFactorEnabled {
		return utils.SuccessResponse(c, TwoFASetupResponse{
			AlreadyEnabled: true,
		})
	}

	setup, err := h.totpService.GenerateSetup(user.Email)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to generate 2FA setup")
	}

	return utils.SuccessResponse(c, TwoFASetupResponse{
		Secret:      setup.Secret,
		QRCodeURL:   setup.QRCodeURL,
		OTPAuthURL:  setup.OTPAuthURL,
		AlreadyEnabled: false,
	})
}

func (h *TwoFAHandler) Setup(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req TwoFASetupRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Code == "" {
		return utils.ValidationErrorResponse(c, "Code is required")
	}
	if req.Secret == "" {
		return utils.ValidationErrorResponse(c, "Secret is required")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	if user.TwoFactorEnabled {
		return utils.ValidationErrorResponse(c, "2FA is already enabled")
	}

	// Use the secret from the GET /2fa/setup step (same secret user scanned into Authy)
	if !h.totpService.ValidateCode(req.Secret, req.Code) {
		return utils.ValidationErrorResponse(c, "Invalid code. Please try again.")
	}

	encryptedSecret, err := h.encryption.Encrypt(req.Secret)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to encrypt secret")
	}

	recoveryCodes := services.GenerateRecoveryCodes()
	hashedCodes := make([]string, len(recoveryCodes))
	for i, code := range recoveryCodes {
		hash, _ := services.HashRecoveryCode(code)
		hashedCodes[i] = hash
	}

	recoveryCodesJSON := strings.Join(hashedCodes, ",")

	user.TwoFactorEnabled = true
	user.TwoFactorSecretEncrypted = encryptedSecret
	user.TwoFactorRecoveryCodes = recoveryCodesJSON

	if err := h.userRepo.Update(user); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to enable 2FA")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"success":       true,
		"recoveryCodes": recoveryCodes,
	})
}

func (h *TwoFAHandler) Verify(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	ipAddress := c.IP()
	userAgent := c.Get("User-Agent")

	var req TwoFAVerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Code == "" {
		return utils.ValidationErrorResponse(c, "Code is required")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	if !user.TwoFactorEnabled {
		return utils.ValidationErrorResponse(c, "2FA is not enabled")
	}

	secret, err := h.encryption.Decrypt(user.TwoFactorSecretEncrypted)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decrypt secret")
	}

	valid := h.totpService.ValidateCode(secret, req.Code)

	if !valid {
		recoveryCodes := strings.Split(user.TwoFactorRecoveryCodes, ",")
		for i, hash := range recoveryCodes {
			if hash != "" && services.CompareRecoveryCode(hash, req.Code) {
				valid = true
				recoveryCodes[i] = ""
				user.TwoFactorRecoveryCodes = strings.Join(recoveryCodes, ",")
				h.userRepo.Update(user)
				break
			}
		}
	}

	if !valid {
		return utils.ValidationErrorResponse(c, "Invalid code. Please try again.")
	}

	expiresAt := time.Time{}
	if req.RememberDevice && req.Fingerprint != "" {
		expiresAt = services.GetRememberDeviceExpiry()
		h.deviceService.CreateOrUpdateDevice(services.CreateDeviceInput{
			UserID:            userID,
			DeviceFingerprint: req.Fingerprint,
			DeviceName:        req.DeviceName,
			IPAddress:         ipAddress,
			UserAgent:         userAgent,
			ExpiresAt:         expiresAt,
		})
	}

	return utils.SuccessResponse(c, fiber.Map{
		"success":    true,
		"expiresAt":  expiresAt,
	})
}

func (h *TwoFAHandler) Disable(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req TwoFADisableRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Password == "" {
		return utils.ValidationErrorResponse(c, "Password is required")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	if !user.TwoFactorEnabled {
		return utils.ValidationErrorResponse(c, "2FA is not enabled")
	}

	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, "Incorrect password")
	}

	user.TwoFactorEnabled = false
	user.TwoFactorSecretEncrypted = ""
	user.TwoFactorRecoveryCodes = ""

	if err := h.userRepo.Update(user); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to disable 2FA")
	}

	h.deviceService.DeleteAllUserDevices(userID)

	return utils.SuccessResponse(c, fiber.Map{
		"success": true,
	})
}

func (h *TwoFAHandler) GetStatus(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	devices, _ := h.deviceService.GetUserDevices(userID)

	return utils.SuccessResponse(c, TwoFAStatusResponse{
		Enabled:               user.TwoFactorEnabled,
		RememberedDevicesCount: len(devices),
	})
}

func (h *TwoFAHandler) GetDevices(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	devices, err := h.deviceService.GetUserDevices(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get devices")
	}

	return utils.SuccessResponse(c, devices)
}

func (h *TwoFAHandler) DeleteDevice(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	deviceIDStr := c.Params("id")

	deviceID, err := uuid.Parse(deviceIDStr)
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid device ID")
	}

	if err := h.deviceService.DeleteDevice(deviceID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete device")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"success": true,
	})
}

func (h *TwoFAHandler) Check2FARequired(c *fiber.Ctx) (bool, error) {
	email := c.FormValue("email")
	if email == "" {
		var req struct {
			Email string `json:"email"`
		}
		c.BodyParser(&req)
		email = req.Email
	}

	if email == "" {
		return false, nil
	}

	user, err := h.userRepo.FindByEmail(strings.ToLower(email))
	if err != nil {
		return false, nil
	}

	if !user.TwoFactorEnabled {
		return false, nil
	}

	fingerprint := c.Get("X-Device-Fingerprint")
	if fingerprint != "" {
		device, err := h.deviceService.GetValidDevice(user.ID, fingerprint)
		if err == nil && device != nil {
			return false, nil
		}
	}

	return true, nil
}
