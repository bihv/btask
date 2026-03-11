package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		service: services.NewAuthService(cfg),
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req services.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Email == "" || req.Password == "" || req.FullName == "" {
		return utils.ValidationErrorResponse(c, "Email, password, and full name are required")
	}

	if len(req.Password) < 6 {
		return utils.ValidationErrorResponse(c, "Password must be at least 6 characters")
	}

	resp, err := h.service.Register(req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
	}

	// Set token as httpOnly cookie
	if err := services.SetTokenCookie(c, resp.Token); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to set session")
	}

	// Return response without token in body (since it's in cookie now)
	resp.Token = ""
	return utils.SuccessResponse(c, resp)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req services.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return utils.ValidationErrorResponse(c, "Email and password are required")
	}

	// Get IP and UserAgent from request
	ipAddress := getRealIP(c)
	userAgent := c.Get("User-Agent")

	// First login to get user and token
	resp, err := h.service.Login(req, services.CreateSessionParams{})
	if err != nil {
		return utils.UnauthorizedResponse(c, err.Error())
	}

	// Get user to create session
	user, _ := h.service.GetUserRepo().FindByEmail(req.Email)
	if user != nil {
		// Create session with token hash
		tokenHash := services.HashToken(resp.Token)
		params := services.CreateSessionParams{
			UserID:    user.ID,
			TokenHash: tokenHash,
			IPAddress: ipAddress,
			UserAgent: userAgent,
		}

		session, sessionErr := h.service.CreateSession(params)
		if sessionErr == nil && session != nil {
			resp.SessionID = session.ID.String()
		}
	}

	// Set token as httpOnly cookie
	if err := services.SetTokenCookie(c, resp.Token); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to set session")
	}

	// Return response without token in body (since it's in cookie now)
	resp.Token = ""
	return utils.SuccessResponse(c, resp)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	services.ClearTokenCookie(c)
	return utils.SuccessResponse(c, fiber.Map{"message": "Logged out successfully"})
}

// getRealIP returns the real client IP, checking X-Forwarded-For and X-Real-IP headers
func getRealIP(c fiber.Ctx) string {
	// Check X-Forwarded-For header first (for reverse proxy)
	ipAddress := c.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = c.Get("X-Real-IP")
	}
	if ipAddress == "" {
		ipAddress = c.IP()
	}
	// Take the first IP if multiple are present (X-Forwarded-For can contain multiple IPs)
	if idx := strings.Index(ipAddress, ","); idx != -1 {
		ipAddress = ipAddress[:idx]
	}
	return strings.TrimSpace(ipAddress)
}
