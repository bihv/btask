package handlers

import (
	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/repository"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChecklistHandler struct {
	repo *repository.ChecklistRepository
}

func NewChecklistHandler() *ChecklistHandler {
	return &ChecklistHandler{
		repo: repository.NewChecklistRepository(),
	}
}

// GetByCardID returns all checklists for a card
func (h *ChecklistHandler) GetByCardID(c *fiber.Ctx) error {
	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	checklists, err := h.repo.GetByCardID(cardID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch checklists")
	}

	return utils.SuccessResponse(c, checklists)
}

// Create creates a new checklist
func (h *ChecklistHandler) Create(c *fiber.Ctx) error {
	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	var req models.CreateChecklistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	checklist := &models.Checklist{
		CardID: cardID,
		Title:  req.Title,
	}

	if err := h.repo.Create(checklist); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create checklist")
	}

	return utils.SuccessResponse(c, checklist)
}

// Update updates a checklist
func (h *ChecklistHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid checklist ID")
	}

	checklist, err := h.repo.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Checklist not found")
	}

	var req models.UpdateChecklistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Title != "" {
		checklist.Title = req.Title
	}
	if req.Position != nil {
		checklist.Position = *req.Position
	}

	if err := h.repo.Update(checklist); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update checklist")
	}

	return utils.SuccessResponse(c, checklist)
}

// Delete deletes a checklist
func (h *ChecklistHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid checklist ID")
	}

	if err := h.repo.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete checklist")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Checklist deleted"})
}

// CreateItem creates a new checklist item
func (h *ChecklistHandler) CreateItem(c *fiber.Ctx) error {
	checklistID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid checklist ID")
	}

	var req models.CreateChecklistItemRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	item := &models.ChecklistItem{
		ChecklistID: checklistID,
		Content:     req.Content,
	}

	if err := h.repo.CreateItem(item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create item")
	}

	return utils.SuccessResponse(c, item)
}

// UpdateItem updates a checklist item
func (h *ChecklistHandler) UpdateItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("itemId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid item ID")
	}

	item, err := h.repo.GetItemByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Item not found")
	}

	var req models.UpdateChecklistItemRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Content != "" {
		item.Content = req.Content
	}
	if req.IsCompleted != nil {
		item.IsCompleted = *req.IsCompleted
	}
	if req.Position != nil {
		item.Position = *req.Position
	}

	if err := h.repo.UpdateItem(item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update item")
	}

	return utils.SuccessResponse(c, item)
}

// DeleteItem deletes a checklist item
func (h *ChecklistHandler) DeleteItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("itemId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid item ID")
	}

	if err := h.repo.DeleteItem(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete item")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Item deleted"})
}

// ToggleItem toggles the completion status of an item
func (h *ChecklistHandler) ToggleItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("itemId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid item ID")
	}

	item, err := h.repo.ToggleItemCompleted(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to toggle item")
	}

	return utils.SuccessResponse(c, item)
}
