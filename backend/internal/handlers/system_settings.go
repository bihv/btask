package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type SystemSettingsHandler struct {
	repo           *repository.SystemSettingsRepository
	cleanupService *services.OrphanCleanupService
}

func NewSystemSettingsHandler() *SystemSettingsHandler {
	return &SystemSettingsHandler{
		repo:           repository.NewSystemSettingsRepository(),
		cleanupService: services.NewOrphanCleanupService(),
	}
}

// Get returns the current system settings
func (h *SystemSettingsHandler) Get(c *fiber.Ctx) error {
	settings, err := h.repo.Get()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch system settings")
	}

	return utils.SuccessResponse(c, settings)
}

// Update updates the system settings
func (h *SystemSettingsHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateSystemSettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	settings, err := h.repo.Get()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch system settings")
	}

	// Update only provided fields
	if req.OrphanCleanupDays != nil {
		if *req.OrphanCleanupDays < 1 {
			return utils.ValidationErrorResponse(c, "Orphan cleanup days must be at least 1")
		}
		if *req.OrphanCleanupDays > 365 {
			return utils.ValidationErrorResponse(c, "Orphan cleanup days cannot exceed 365")
		}
		settings.OrphanCleanupDays = *req.OrphanCleanupDays
	}

	if req.OrphanCleanupEnabled != nil {
		settings.OrphanCleanupEnabled = *req.OrphanCleanupEnabled
	}

	if req.MaxUploadSizeMB != nil {
		if *req.MaxUploadSizeMB < 1 {
			return utils.ValidationErrorResponse(c, "Max upload size must be at least 1 MB")
		}
		if *req.MaxUploadSizeMB > 500 {
			return utils.ValidationErrorResponse(c, "Max upload size cannot exceed 500 MB")
		}
		settings.MaxUploadSizeMB = *req.MaxUploadSizeMB
	}

	if req.AllowedFileTypes != nil {
		settings.AllowedFileTypes = *req.AllowedFileTypes
	}

	if err := h.repo.Update(settings); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update system settings")
	}

	return utils.SuccessResponse(c, settings)
}

// RunCleanup runs the orphan cleanup job manually
func (h *SystemSettingsHandler) RunCleanup(c *fiber.Ctx) error {
	deleted, failed, err := h.cleanupService.RunManualCleanup()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to run cleanup: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"deleted": deleted,
		"failed":  failed,
		"message": "Cleanup completed",
	})
}
