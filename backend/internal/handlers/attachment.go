package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/logger"
	"github.com/mello/backend/pkg/utils"
	"go.uber.org/zap"
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

	// Check if source filter is provided
	source := c.Query("source")
	var attachments []models.Attachment

	if source != "" {
		attachments, err = h.repo.GetByCardIDAndSource(cardID, models.AttachmentSource(source))
	} else {
		attachments, err = h.repo.GetByCardID(cardID)
	}

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

	// Set default source if not provided
	source := req.Source
	if source == "" {
		source = models.AttachmentSourceUpload
	}

	attachment := &models.Attachment{
		CardID:     cardID,
		FileName:   req.FileName,
		FileURL:    req.FileURL,
		FileType:   req.FileType,
		FileSize:   req.FileSize,
		UploadedBy: userID,
		Source:     source,
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

// Delete deletes an attachment and its file from storage
func (h *AttachmentHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid attachment ID")
	}

	// Get attachment before deleting to get file URL
	attachment, err := h.repo.DeleteByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete attachment")
	}

	// Delete file from MinIO storage
	minioStorage := storage.GetMinioStorage()
	if minioStorage != nil && attachment.FileURL != "" {
		if err := minioStorage.DeleteFile(context.Background(), attachment.FileURL); err != nil {
			// Log error but don't fail the request - attachment record is already deleted
			logger.Warn("Failed to delete file from storage",
				zap.String("file_url", attachment.FileURL),
				zap.Error(err),
			)
		}
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Attachment deleted"})
}

// SyncEditorAttachments syncs orphan status for editor attachments based on content URLs
// POST /api/cards/:cardId/attachments/sync-orphans
func (h *AttachmentHandler) SyncEditorAttachments(c *fiber.Ctx) error {
	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	var req struct {
		URLs []string `json:"urls"` // URLs still present in the editor content
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Create a map of active URLs for quick lookup
	activeURLs := make(map[string]bool)
	for _, url := range req.URLs {
		activeURLs[url] = true
	}

	// Get all editor attachments for this card
	editorAttachments, err := h.repo.GetEditorAttachmentsByCardID(cardID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attachments")
	}

	orphanedCount := 0
	restoredCount := 0

	for _, att := range editorAttachments {
		isActive := activeURLs[att.FileURL]
		
		if !isActive && !att.IsOrphan {
			// URL no longer in content, mark as orphan
			if err := h.repo.MarkAsOrphan(att.ID); err != nil {
				logger.Warn("Failed to mark attachment as orphan",
					zap.String("id", att.ID.String()),
					zap.Error(err),
				)
			} else {
				orphanedCount++
			}
		} else if isActive && att.IsOrphan {
			// URL is back in content (undo), unmark orphan
			if err := h.repo.UnmarkOrphan(att.ID); err != nil {
				logger.Warn("Failed to unmark attachment orphan",
					zap.String("id", att.ID.String()),
					zap.Error(err),
				)
			} else {
				restoredCount++
			}
		}
	}

	return utils.SuccessResponse(c, fiber.Map{
		"orphaned": orphanedCount,
		"restored": restoredCount,
	})
}
