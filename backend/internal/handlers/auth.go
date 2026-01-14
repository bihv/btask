package handlers

import (
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

	resp, err := h.service.Login(req)
	if err != nil {
		return utils.UnauthorizedResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, resp)
}
