package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/utils"
)

// isEmojiAvatar checks if the avatar URL is an emoji avatar (not a file to delete)
func isEmojiAvatar(avatarURL string) bool {
	return strings.HasPrefix(avatarURL, "emoji:")
}

type UserHandler struct {
	userRepo     *repository.UserRepository
	emailService *services.EmailService
	labelService *services.LabelService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userRepo:     repository.NewUserRepository(),
		emailService: services.NewEmailService(config.GetConfig()),
		labelService: services.GetLabelService(),
	}
}

// GetUserRepo returns the user repository for use in middleware
func (h *UserHandler) GetUserRepo() *repository.UserRepository {
	return h.userRepo
}

// t is a helper function to get translated label for a user
func (h *UserHandler) t(key string, user *models.User) string {
	lang := "en"
	if user != nil && user.Language != "" {
		lang = user.Language
	}
	return h.labelService.Get(key, lang)
}

func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, h.labelService.Get("ERROR_INVALID_USER_ID", "en"))
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, h.labelService.Get("ERROR_INVALID_USER_ID", "en"))
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.t("ERROR_USER_NOT_FOUND", user))
	}

	if userID != id {
		return utils.UnauthorizedResponse(c, h.t("ERROR_UNAUTHORIZED_PROFILE_UPDATE", user))
	}

	var req struct {
		FullName  string  `json:"full_name"`
		Bio       *string `json:"bio"`
		AvatarURL *string `json:"avatar_url"` // nil = not sent, "" = clear, "url" = set
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, h.t("ERROR_INVALID_REQUEST_BODY", user))
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	// Bio is a pointer - nil means not sent, empty string means clear
	if req.Bio != nil {
		user.Bio = *req.Bio
	}

	// Handle avatar update/removal
	// AvatarURL is a pointer - nil means not sent, empty string means clear, value means set
	if req.AvatarURL != nil {
		newAvatarURL := *req.AvatarURL

		// Delete old avatar from storage if it exists and is changing
		if user.AvatarURL != "" && user.AvatarURL != newAvatarURL && !isEmojiAvatar(user.AvatarURL) {
			minioStorage := storage.GetMinioStorage()
			if minioStorage != nil {
				_ = minioStorage.DeleteFile(c.Context(), user.AvatarURL)
			}
		}
		user.AvatarURL = newAvatarURL
	}

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_UPDATE_USER_FAILED", user))
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) Search(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return utils.ValidationErrorResponse(c, h.labelService.Get("ERROR_EMAIL_QUERY_REQUIRED", "en"))
	}

	user, err := h.userRepo.FindByEmail(email)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	return utils.SuccessResponse(c, models.UserResponse{
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
	})
}

// ChangePassword changes the user's password
func (h *UserHandler) ChangePassword(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, h.t("ERROR_INVALID_REQUEST_BODY", user))
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_REQUIRED", user))
	}

	if len(req.NewPassword) < 6 {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_TOO_SHORT", user))
	}

	// Verify current password
	if !user.CheckPassword(req.CurrentPassword) {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_INCORRECT", user))
	}

	// Set new password
	if err := user.SetPassword(req.NewPassword); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_SET_PASSWORD_FAILED", user))
	}

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_UPDATE_PASSWORD_FAILED", user))
	}

	return utils.SuccessResponse(c, fiber.Map{"message": h.t("SUCCESS_PASSWORD_CHANGED", user)})
}

// ChangeEmail initiates email change by sending verification email
func (h *UserHandler) ChangeEmail(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	var req struct {
		NewEmail string `json:"new_email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, h.t("ERROR_INVALID_REQUEST_BODY", user))
	}

	if req.NewEmail == "" || req.Password == "" {
		return utils.ValidationErrorResponse(c, h.t("ERROR_EMAIL_PASSWORD_REQUIRED", user))
	}

	// Validate new email is different from current email
	if strings.EqualFold(req.NewEmail, user.Email) {
		return utils.ValidationErrorResponse(c, h.t("ERROR_EMAIL_SAME_AS_CURRENT", user))
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_INCORRECT", user))
	}

	// Check if email is already in use
	existingUser, _ := h.userRepo.FindByEmail(req.NewEmail)
	if existingUser != nil && existingUser.ID != userID {
		return utils.ValidationErrorResponse(c, h.t("ERROR_EMAIL_IN_USE", user))
	}

	// Generate verification token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_GENERATE_TOKEN_FAILED", user))
	}
	token := hex.EncodeToString(tokenBytes)

	// Set pending email and token (expires in 24h)
	expiry := time.Now().Add(24 * time.Hour)
	user.PendingEmail = req.NewEmail
	user.EmailVerifyToken = token
	user.EmailVerifyExpiry = &expiry

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_SAVE_VERIFICATION_FAILED", user))
	}

	// Send verification email
	if err := h.emailService.SendEmailVerification(req.NewEmail, token); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_SEND_EMAIL_FAILED", user))
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": h.t("SUCCESS_EMAIL_VERIFICATION_SENT", user),
	})
}

// VerifyEmailChange verifies the email change token and updates the email
func (h *UserHandler) VerifyEmailChange(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return utils.ValidationErrorResponse(c, h.labelService.Get("ERROR_TOKEN_REQUIRED", "en"))
	}

	user, err := h.userRepo.FindByEmailVerifyToken(token)
	if err != nil {
		return utils.ValidationErrorResponse(c, h.labelService.Get("ERROR_TOKEN_INVALID", "en"))
	}

	// Check if token is expired
	if user.EmailVerifyExpiry == nil || time.Now().After(*user.EmailVerifyExpiry) {
		// Clear expired token
		user.PendingEmail = ""
		user.EmailVerifyToken = ""
		user.EmailVerifyExpiry = nil
		h.userRepo.Update(user)
		return utils.ValidationErrorResponse(c, h.t("ERROR_TOKEN_EXPIRED", user))
	}

	// Check if pending email is not empty
	if user.PendingEmail == "" {
		return utils.ValidationErrorResponse(c, h.t("ERROR_NO_PENDING_EMAIL", user))
	}

	// Check if new email is still available
	existingUser, _ := h.userRepo.FindByEmail(user.PendingEmail)
	if existingUser != nil && existingUser.ID != user.ID {
		return utils.ValidationErrorResponse(c, h.t("ERROR_EMAIL_IN_USE", user))
	}

	// Update email
	user.Email = user.PendingEmail
	user.PendingEmail = ""
	user.EmailVerifyToken = ""
	user.EmailVerifyExpiry = nil

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_UPDATE_EMAIL_FAILED", user))
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": h.t("SUCCESS_EMAIL_CHANGED", user),
		"email":   user.Email,
	})
}

// UpdatePreferences updates user preferences (notifications, language, timezone)
func (h *UserHandler) UpdatePreferences(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	var req struct {
		NotifyCardAssigned *bool   `json:"notify_card_assigned"`
		NotifyDueDate      *bool   `json:"notify_due_date"`
		NotifyComment      *bool   `json:"notify_comment"`
		NotifyMention      *bool   `json:"notify_mention"`
		Language           *string `json:"language"`
		Timezone           *string `json:"timezone"`
		DateFormat         *string `json:"date_format"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, h.t("ERROR_INVALID_REQUEST_BODY", user))
	}

	// Update only provided fields
	if req.NotifyCardAssigned != nil {
		user.NotifyCardAssigned = *req.NotifyCardAssigned
	}
	if req.NotifyDueDate != nil {
		user.NotifyDueDate = *req.NotifyDueDate
	}
	if req.NotifyComment != nil {
		user.NotifyComment = *req.NotifyComment
	}
	if req.NotifyMention != nil {
		user.NotifyMention = *req.NotifyMention
	}
	if req.Language != nil {
		user.Language = *req.Language
	}
	if req.Timezone != nil {
		user.Timezone = *req.Timezone
	}
	if req.DateFormat != nil {
		user.DateFormat = *req.DateFormat
	}

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_UPDATE_PREFERENCES_FAILED", user))
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

// DeleteAccount deletes the user's account
func (h *UserHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, h.labelService.Get("ERROR_USER_NOT_FOUND", "en"))
	}

	var req struct {
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, h.t("ERROR_INVALID_REQUEST_BODY", user))
	}

	if req.Password == "" {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_DELETE_REQUIRED", user))
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, h.t("ERROR_PASSWORD_INCORRECT", user))
	}

	// Delete avatar from storage if exists
	if user.AvatarURL != "" && !isEmojiAvatar(user.AvatarURL) {
		minioStorage := storage.GetMinioStorage()
		if minioStorage != nil {
			_ = minioStorage.DeleteFile(c.Context(), user.AvatarURL)
		}
	}

	if err := h.userRepo.Delete(userID); err != nil {
		return utils.InternalErrorResponse(c, h.t("ERROR_DELETE_ACCOUNT_FAILED", user))
	}

	return utils.SuccessResponse(c, fiber.Map{"message": h.t("SUCCESS_ACCOUNT_DELETED", user)})
}
