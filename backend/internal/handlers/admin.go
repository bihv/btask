package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/pkg/utils"
)

type AdminHandler struct {
	userRepo *repository.UserRepository
}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{
		userRepo: repository.NewUserRepository(),
	}
}

// ListUsers returns all users (admin only)
func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	users, err := h.userRepo.FindAll()
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to fetch users")
	}

	var responses []fiber.Map
	for _, user := range users {
		responses = append(responses, fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"full_name":  user.FullName,
			"is_admin":   user.IsAdmin,
			"created_at": user.CreatedAt,
		})
	}

	return utils.SuccessResponse(c, responses)
}

// UpdateUserRole updates a user's admin status (admin only)
func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	currentUserID := middleware.GetUserID(c)
	if userID == currentUserID {
		return utils.ValidationErrorResponse(c, "Cannot change your own admin status")
	}

	var req struct {
		IsAdmin bool `json:"is_admin"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	user.IsAdmin = req.IsAdmin
	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update user role")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"id":       user.ID,
		"email":    user.Email,
		"is_admin": user.IsAdmin,
	})
}
