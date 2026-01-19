package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	ws "github.com/mello/backend/internal/websocket"
	"github.com/mello/backend/pkg/utils"
)

type SystemLabelHandler struct {
	repo         *repository.SystemLabelRepository
	labelService *services.LabelService
}

func NewSystemLabelHandler() *SystemLabelHandler {
	return &SystemLabelHandler{
		repo:         repository.NewSystemLabelRepository(),
		labelService: services.GetLabelService(),
	}
}

// GetLabels returns all labels resolved to the user's language preference
func (h *SystemLabelHandler) GetLabels(c *fiber.Ctx) error {
	// Get language from authenticated user, fallback to query param, then default
	language := "en" // Default

	// Try to get user from context (set by auth middleware)
	if userID := c.Locals("userID"); userID != nil {
		uid := userID.(uuid.UUID)
		userRepo := repository.NewUserRepository()
		user, err := userRepo.FindByID(uid)
		if err == nil && user.Language != "" {
			language = user.Language
		}
	}

	// Allow override via query param for flexibility
	if langParam := c.Query("lang"); langParam != "" {
		language = langParam
	}

	labels := h.labelService.GetAll(language)
	return utils.SuccessResponse(c, labels)
}

// --- Admin endpoints ---

// GetAllLabels returns paginated labels with translations for admin
func (h *SystemLabelHandler) GetAllLabels(c *fiber.Ctx) error {
	// Parse pagination params
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	search := c.Query("search", "")
	category := c.Query("category", "")

	// Validate
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	labels, total, err := h.repo.FindAllPaginated(page, limit, search, category)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to fetch labels")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"labels": labels,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// CreateLabel creates a new label
func (h *SystemLabelHandler) CreateLabel(c *fiber.Ctx) error {
	var req models.CreateSystemLabelRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Key == "" || req.DefaultValue == "" {
		return utils.ValidationErrorResponse(c, "Key and default_value are required")
	}

	label := &models.SystemLabel{
		Key:          req.Key,
		Category:     req.Category,
		DefaultValue: req.DefaultValue,
		Description:  req.Description,
	}

	if err := h.repo.Create(label); err != nil {
		return utils.InternalErrorResponse(c, "Failed to create label")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessResponse(c, label)
}

// UpdateLabel updates a label
func (h *SystemLabelHandler) UpdateLabel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	label, err := h.repo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "Label not found")
	}

	var req models.UpdateSystemLabelRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Key != "" {
		label.Key = req.Key
	}
	if req.Category != "" {
		label.Category = req.Category
	}
	if req.DefaultValue != "" {
		label.DefaultValue = req.DefaultValue
	}
	if req.Description != "" {
		label.Description = req.Description
	}

	if err := h.repo.Update(label); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update label")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessResponse(c, label)
}

// DeleteLabel deletes a label
func (h *SystemLabelHandler) DeleteLabel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	if err := h.repo.Delete(id); err != nil {
		return utils.InternalErrorResponse(c, "Failed to delete label")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessMessageResponse(c, "Label deleted")
}

// --- Translation endpoints ---

// CreateTranslation creates a new translation
func (h *SystemLabelHandler) CreateTranslation(c *fiber.Ctx) error {
	var req models.CreateTranslationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.LabelID == uuid.Nil || req.Language == "" || req.Value == "" {
		return utils.ValidationErrorResponse(c, "label_id, language, and value are required")
	}

	// Check if label exists
	_, err := h.repo.FindByID(req.LabelID)
	if err != nil {
		return utils.NotFoundResponse(c, "Label not found")
	}

	// Check if translation already exists
	if h.repo.TranslationExists(req.LabelID, req.Language) {
		return utils.ValidationErrorResponse(c, "Translation already exists for this language")
	}

	translation := &models.SystemTranslation{
		LabelID:  req.LabelID,
		Language: req.Language,
		Value:    req.Value,
	}

	if err := h.repo.CreateTranslation(translation); err != nil {
		return utils.InternalErrorResponse(c, "Failed to create translation")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessResponse(c, translation)
}

// UpdateTranslation updates a translation
func (h *SystemLabelHandler) UpdateTranslation(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid translation ID")
	}

	translation, err := h.repo.FindTranslationByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "Translation not found")
	}

	var req models.UpdateTranslationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Value == "" {
		return utils.ValidationErrorResponse(c, "Value is required")
	}

	translation.Value = req.Value
	if err := h.repo.UpdateTranslation(translation); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update translation")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessResponse(c, translation)
}

// DeleteTranslation deletes a translation
func (h *SystemLabelHandler) DeleteTranslation(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid translation ID")
	}

	if err := h.repo.DeleteTranslation(id); err != nil {
		return utils.InternalErrorResponse(c, "Failed to delete translation")
	}

	h.labelService.ClearCache()
	BroadcastLabelsUpdated()

	return utils.SuccessMessageResponse(c, "Translation deleted")
}

// BroadcastLabelsUpdated notifies all clients that labels have been updated
func BroadcastLabelsUpdated() {
	// Use existing WebSocket broadcast
	ws.GlobalHub.BroadcastToAll(map[string]interface{}{
		"type": "LABELS_UPDATED",
	})
}
