package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/utils"
)

// isEmojiAvatar checks if the avatar URL is an emoji avatar (not a file to delete)
func isEmojiAvatar(avatarURL string) bool {
	return strings.HasPrefix(avatarURL, "emoji:")
}

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userRepo: repository.NewUserRepository(),
	}
}

func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	if userID != id {
		return utils.UnauthorizedResponse(c, "Can only update your own profile")
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	var req struct {
		FullName  string  `json:"full_name"`
		Bio       *string `json:"bio"`
		AvatarURL *string `json:"avatar_url"` // nil = not sent, "" = clear, "url" = set
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
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
		return utils.InternalErrorResponse(c, "Failed to update user")
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

func (h *UserHandler) Search(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return utils.ValidationErrorResponse(c, "Email query is required")
	}

	user, err := h.userRepo.FindByEmail(email)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
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
		return utils.NotFoundResponse(c, "User not found")
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return utils.ValidationErrorResponse(c, "Current password and new password are required")
	}

	if len(req.NewPassword) < 6 {
		return utils.ValidationErrorResponse(c, "New password must be at least 6 characters")
	}

	// Verify current password
	if !user.CheckPassword(req.CurrentPassword) {
		return utils.ValidationErrorResponse(c, "Current password is incorrect")
	}

	// Set new password
	if err := user.SetPassword(req.NewPassword); err != nil {
		return utils.InternalErrorResponse(c, "Failed to set new password")
	}

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update password")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Password changed successfully"})
}

// ChangeEmail changes the user's email
func (h *UserHandler) ChangeEmail(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	var req struct {
		NewEmail string `json:"new_email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.NewEmail == "" || req.Password == "" {
		return utils.ValidationErrorResponse(c, "New email and password are required")
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, "Password is incorrect")
	}

	// Check if email is already in use
	existingUser, _ := h.userRepo.FindByEmail(req.NewEmail)
	if existingUser != nil && existingUser.ID != userID {
		return utils.ValidationErrorResponse(c, "Email is already in use")
	}

	user.Email = req.NewEmail

	if err := h.userRepo.Update(user); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update email")
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

// UpdatePreferences updates user preferences (notifications, language, timezone)
func (h *UserHandler) UpdatePreferences(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
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
		return utils.ValidationErrorResponse(c, "Invalid request body")
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
		return utils.InternalErrorResponse(c, "Failed to update preferences")
	}

	return utils.SuccessResponse(c, user.ToResponse())
}

// DeleteAccount deletes the user's account
func (h *UserHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	var req struct {
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Password == "" {
		return utils.ValidationErrorResponse(c, "Password is required to delete account")
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		return utils.ValidationErrorResponse(c, "Password is incorrect")
	}

	// Delete avatar from storage if exists
	if user.AvatarURL != "" && !isEmojiAvatar(user.AvatarURL) {
		minioStorage := storage.GetMinioStorage()
		if minioStorage != nil {
			_ = minioStorage.DeleteFile(c.Context(), user.AvatarURL)
		}
	}

	if err := h.userRepo.Delete(userID); err != nil {
		return utils.InternalErrorResponse(c, "Failed to delete account")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Account deleted successfully"})
}
