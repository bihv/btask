package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/events"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type ChecklistHandler struct {
	repo        *repository.ChecklistRepository
	cardService *services.CardService
}

func NewChecklistHandler(eventBus *events.EventBus) *ChecklistHandler {
	return &ChecklistHandler{
		repo:        repository.NewChecklistRepository(),
		cardService: services.NewCardService(eventBus),
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
		DueDate:     req.DueDate,
	}

	if err := h.repo.CreateItem(item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create item")
	}

	// Add assignees if provided
	if len(req.AssigneeIDs) > 0 {
		if err := h.repo.SyncItemAssignees(item.ID, req.AssigneeIDs); err != nil {
			// Log but don't fail the request
		}
	}

	// Reload item with assignees
	item, _ = h.repo.GetItemByID(item.ID)

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
	// Handle due date - ClearDueDate flag explicitly clears it, otherwise set if provided
	if req.ClearDueDate {
		item.DueDate = nil
	} else if req.DueDate != nil {
		item.DueDate = req.DueDate
	}

	if err := h.repo.UpdateItem(item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update item")
	}

	// Sync assignees if provided (empty array means remove all)
	if req.AssigneeIDs != nil {
		if err := h.repo.SyncItemAssignees(item.ID, req.AssigneeIDs); err != nil {
			// Log but don't fail the request
		}
	}

	// Reload item with assignees
	item, _ = h.repo.GetItemByID(item.ID)

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

// ConvertItemToCard converts a checklist item to a card
func (h *ChecklistHandler) ConvertItemToCard(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	itemID, err := uuid.Parse(c.Params("itemId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid item ID")
	}

	var req models.ConvertToCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get the checklist item with its checklist info
	item, err := h.repo.GetItemWithChecklist(itemID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Item not found")
	}

	// Create the card with the item's content as title
	cardReq := models.CreateCardRequest{
		Title:   item.Content,
		DueDate: item.DueDate,
	}

	card, err := h.cardService.Create(req.ListID, userID, cardReq)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create card: "+err.Error())
	}

	// If item has assignees, add them as card members
	for _, assignee := range item.Assignees {
		if err := h.cardService.AddMember(card.ID, assignee.UserID, userID); err != nil {
			// Log but don't fail the request
		}
	}

	// Delete the checklist item
	if err := h.repo.DeleteItem(itemID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete item")
	}

	return utils.SuccessResponse(c, card)
}
