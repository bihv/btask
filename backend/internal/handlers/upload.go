package handlers

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/utils"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadFile handles file upload to MinIO
func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		return utils.ValidationErrorResponse(c, "No file provided")
	}

	// Check file size
	if file.Size > storage.MaxFileSize {
		return utils.ValidationErrorResponse(c, fmt.Sprintf("File size exceeds maximum allowed size of %d MB", storage.MaxFileSize/(1024*1024)))
	}

	// Get content type
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Validate content type
	allowedTypes := storage.GetAllowedContentTypes()
	if !allowedTypes[contentType] {
		return utils.ValidationErrorResponse(c, "File type not allowed")
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
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Storage not initialized")
	}

	url, err := minioStorage.UploadFile(context.Background(), src, file.Filename, contentType, file.Size)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload file: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"url":      url,
		"filename": file.Filename,
		"size":     file.Size,
		"type":     contentType,
	})
}
