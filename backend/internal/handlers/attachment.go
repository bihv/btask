package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/pkg/utils"
)

type AttachmentHandler struct {
	repo *repository.AttachmentRepository
}

func NewAttachmentHandler() *AttachmentHandler {
	return &AttachmentHandler{
		repo: repository.NewAttachmentRepository(),
	}
}

// GetByCardID returns all attachments for a card
func (h *AttachmentHandler) GetByCardID(c *fiber.Ctx) error {
	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	attachments, err := h.repo.GetByCardID(cardID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attachments")
	}

	return utils.SuccessResponse(c, attachments)
}

// Create creates a new attachment
func (h *AttachmentHandler) Create(c *fiber.Ctx) error {
	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	userID := c.Locals("userID").(uuid.UUID)

	var req models.CreateAttachmentRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	attachment := &models.Attachment{
		CardID:     cardID,
		FileName:   req.FileName,
		FileURL:    req.FileURL,
		FileType:   req.FileType,
		FileSize:   req.FileSize,
		UploadedBy: userID,
	}

	if err := h.repo.Create(attachment); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create attachment")
	}

	// Fetch with relations
	created, _ := h.repo.GetByID(attachment.ID)
	if created != nil {
		return utils.SuccessResponse(c, created)
	}

	return utils.SuccessResponse(c, attachment)
}

// Delete deletes an attachment
func (h *AttachmentHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid attachment ID")
	}

	if err := h.repo.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete attachment")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Attachment deleted"})
}
