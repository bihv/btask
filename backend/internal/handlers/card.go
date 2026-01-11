package handlers

import (
	"fmt"

	"github.com/btask/backend/internal/middleware"
	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/services"
	"github.com/btask/backend/internal/websocket"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CardHandler struct {
	service             *services.CardService
	notificationService *services.NotificationService
}

func NewCardHandler() *CardHandler {
	return &CardHandler{
		service:             services.NewCardService(),
		notificationService: services.NewNotificationService(),
	}
}

func (h *CardHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("listId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	var req models.CreateCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Title == "" {
		return utils.ValidationErrorResponse(c, "Title is required")
	}

	card, err := h.service.Create(listID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Notify list watchers about new card
	go func() {
		notifications, _ := h.notificationService.NotifyListWatchers(
			listID,
			userID,
			"card_created",
			"New card created",
			fmt.Sprintf("Card \"%s\" was added to the list", card.Title),
			&card.ID,
		)
		// Push via WebSocket
		if websocket.GlobalHub != nil {
			websocket.GlobalHub.SendNotificationsToUsers(notifications)
		}
	}()

	return utils.SuccessResponse(c, card)
}

func (h *CardHandler) GetByID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	card, err := h.service.GetByID(id, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, card)
}

func (h *CardHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	var req models.UpdateCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	card, err := h.service.Update(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, card)
}

func (h *CardHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Card deleted successfully")
}

func (h *CardHandler) Move(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	var req models.MoveCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.Move(id, userID, req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Card moved successfully")
}

func (h *CardHandler) AddLabel(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	var req struct {
		LabelID uuid.UUID `json:"label_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.AddLabel(cardID, req.LabelID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Label added successfully")
}

func (h *CardHandler) RemoveLabel(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	labelID, err := uuid.Parse(c.Params("labelId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	if err := h.service.RemoveLabel(cardID, labelID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Label removed successfully")
}

func (h *CardHandler) AddMember(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	var req struct {
		UserID uuid.UUID `json:"user_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.AddMember(cardID, req.UserID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Member added successfully")
}

func (h *CardHandler) RemoveMember(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	memberID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	if err := h.service.RemoveMember(cardID, memberID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Member removed successfully")
}

func (h *CardHandler) Archive(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	if err := h.service.Archive(cardID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Card archived successfully")
}

func (h *CardHandler) Unarchive(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	if err := h.service.Unarchive(cardID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Card restored successfully")
}

func (h *CardHandler) GetArchivedCards(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	cards, err := h.service.GetArchivedByBoardID(boardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, cards)
}
