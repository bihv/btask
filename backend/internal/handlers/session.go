package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type SessionHandler struct {
	authService *services.AuthService
}

func NewSessionHandler(cfg *config.Config) *SessionHandler {
	return &SessionHandler{
		authService: services.NewAuthService(cfg),
	}
}

// GetSessions returns all sessions for the current user
func (h *SessionHandler) GetSessions(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	sessions, err := h.authService.GetSessions(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get sessions")
	}

	return utils.SuccessResponse(c, fiber.Map{"sessions": sessions})
}

// RevokeSession revokes a specific session
func (h *SessionHandler) RevokeSession(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	sessionIDStr := c.Params("id")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid session ID")
	}

	// Get session to verify it belongs to user
	sessions, err := h.authService.GetSessions(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get sessions")
	}

	// Check if session belongs to user
	found := false
	for _, s := range sessions {
		if s.ID == sessionID {
			found = true
			break
		}
	}

	if !found {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Session not found")
	}

	// Revoke the session
	if err := h.authService.RevokeSession(sessionID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to revoke session")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Session revoked successfully"})
}

// RevokeAllSessions revokes all sessions except the current one
func (h *SessionHandler) RevokeAllSessions(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	// Get current session ID from context (set by auth middleware)
	currentSessionID, ok := c.Locals("sessionID").(uuid.UUID)
	if !ok {
		currentSessionID = uuid.Nil
	}

	if err := h.authService.RevokeAllSessions(userID, currentSessionID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to revoke sessions")
	}

	// Clear the token cookie
	services.ClearTokenCookie(c)

	return utils.SuccessResponse(c, fiber.Map{"message": "All other sessions revoked successfully"})
}
