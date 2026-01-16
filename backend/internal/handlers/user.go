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
