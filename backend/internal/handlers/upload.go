package handlers

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/logger"
	"github.com/mello/backend/pkg/utils"
	"go.uber.org/zap"
)

type UploadHandler struct {
	settingsRepo *repository.SystemSettingsRepository
}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{
		settingsRepo: repository.NewSystemSettingsRepository(),
	}
}

// UploadFile handles file upload to MinIO, organizing files by user ID
func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	// Get user ID for organizing files
	userID := middleware.GetUserID(c)

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		return utils.ValidationErrorResponse(c, "No file provided")
	}

	// Get max file size from settings
	maxSizeMB := h.settingsRepo.GetMaxUploadSize()
	maxSize := int64(maxSizeMB) * 1024 * 1024

	// Check file size
	if file.Size > maxSize {
		return utils.ValidationErrorResponse(c, fmt.Sprintf("File size exceeds maximum allowed size of %d MB", maxSizeMB))
	}

	// Get content type
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Validate content type using settings
	if !h.settingsRepo.IsContentTypeAllowed(contentType) {
		return utils.ValidationErrorResponse(c, "File type not allowed: "+contentType)
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to open file")
	}
	defer src.Close()

	// Upload to MinIO
	minioStorage := storage.GetMinioStorage()
	if minioStorage == nil {
		logger.Error("Upload failed: MinIO storage not initialized")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Storage not initialized")
	}

	// Upload with user ID prefix for organization
	url, err := minioStorage.UploadFileWithPrefix(context.Background(), src, file.Filename, contentType, file.Size, fmt.Sprintf("users/%s", userID.String()))
	if err != nil {
		logger.Error("Upload failed: MinIO upload error", zap.Error(err))
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload file: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"url":      url,
		"filename": file.Filename,
		"size":     file.Size,
		"type":     contentType,
	})
}
