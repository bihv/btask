package handlers

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/internal/websocket"
	"github.com/mello/backend/pkg/utils"
)

type CardHandler struct {
	service             *services.CardService
	listService         *services.ListService
	notificationService *services.NotificationService
	linkPreviewService  *services.LinkPreviewService
	webhookService      *services.WebhookService
}

func NewCardHandler() *CardHandler {
	webhookRepo := repository.NewWebhookRepository(database.DB)
	return &CardHandler{
		service:             services.NewCardService(),
		listService:         services.NewListService(),
		notificationService: services.NewNotificationService(),
		linkPreviewService:  services.NewLinkPreviewService(),
		webhookService:      services.NewWebhookService(webhookRepo),
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

	// Get board ID from list for board watcher notifications
	list, _ := h.listService.GetByID(listID, userID)

	// Notify list watchers and board watchers about new card
	go func() {
		listNotifications, _ := h.notificationService.NotifyListWatchers(
			listID,
			userID,
			"card_created",
			"New card created",
			fmt.Sprintf("Card \"%s\" was added to the list", card.Title),
			&card.ID,
		)
		// Push via WebSocket
		if websocket.GlobalHub != nil {
			websocket.GlobalHub.SendNotificationsToUsers(listNotifications)
		}

		// Notify board watchers
		if list != nil {
			boardNotifications, _ := h.notificationService.NotifyBoardWatchers(
				list.BoardID,
				userID,
				"card_created",
				"New card created",
				fmt.Sprintf("Card \"%s\" was added to \"%s\"", card.Title, list.Title),
				&listID,
				&card.ID,
			)
			if websocket.GlobalHub != nil {
				websocket.GlobalHub.SendNotificationsToUsers(boardNotifications)
			}
		}
	}()

	// Trigger webhook event
	if list != nil {
		go h.webhookService.TriggerEvent(services.EventCardCreated, &list.BoardID, map[string]interface{}{
			"card_id":    card.ID.String(),
			"card_title": card.Title,
			"list_id":    listID.String(),
			"board_id":   list.BoardID.String(),
			"user_id":    userID.String(),
		})
	}

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

	// Get list info for notifications
	list, _ := h.listService.GetByID(card.ListID, userID)

	// Notify board watchers about card update/completion/due date
	go func() {
		if list != nil {
			var notifType, title, message string

			if req.IsCompleted != nil && *req.IsCompleted {
				notifType = "card_completed"
				title = "Card completed"
				message = fmt.Sprintf("Card \"%s\" was marked as complete", card.Title)
			} else if req.DueDate != nil {
				notifType = "due_date_changed"
				title = "Due date changed"
				message = fmt.Sprintf("Due date was set for card \"%s\"", card.Title)
			} else if req.Title != "" || req.Description != "" {
				notifType = "card_updated"
				title = "Card updated"
				message = fmt.Sprintf("Card \"%s\" was updated", card.Title)
			} else {
				return
			}

			listID := card.ListID
			cardID := card.ID
			notifications, _ := h.notificationService.NotifyBoardWatchers(
				list.BoardID,
				userID,
				notifType,
				title,
				message,
				&listID,
				&cardID,
			)
			if websocket.GlobalHub != nil {
				websocket.GlobalHub.SendNotificationsToUsers(notifications)
			}
		}
	}()

	// Trigger webhook event
	if list != nil {
		go h.webhookService.TriggerEvent(services.EventCardUpdated, &list.BoardID, map[string]interface{}{
			"card_id":    card.ID.String(),
			"card_title": card.Title,
			"list_id":    card.ListID.String(),
			"board_id":   list.BoardID.String(),
			"user_id":    userID.String(),
		})
	}

	return utils.SuccessResponse(c, card)
}

func (h *CardHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	// Get card info before deletion for webhook
	card, _ := h.service.GetByID(id, userID)
	var boardID *uuid.UUID
	if card != nil {
		list, _ := h.listService.GetByID(card.ListID, userID)
		if list != nil {
			boardID = &list.BoardID
		}
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Trigger webhook event
	if boardID != nil && card != nil {
		go h.webhookService.TriggerEvent(services.EventCardDeleted, boardID, map[string]interface{}{
			"card_id":    id.String(),
			"card_title": card.Title,
			"board_id":   boardID.String(),
			"user_id":    userID.String(),
		})
	}

	return utils.SuccessMessageResponse(c, "Card deleted successfully")
}

func (h *CardHandler) Move(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	// Get card info before move
	card, _ := h.service.GetByID(id, userID)

	var req models.MoveCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.Move(id, userID, req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Get new list info for notifications
	newList, _ := h.listService.GetByID(req.ListID, userID)

	// Notify board watchers about card move
	go func() {
		if card != nil && newList != nil {
			cardID := card.ID
			newListID := req.ListID
			notifications, _ := h.notificationService.NotifyBoardWatchers(
				newList.BoardID,
				userID,
				"card_moved",
				"Card moved",
				fmt.Sprintf("Card \"%s\" was moved to \"%s\"", card.Title, newList.Title),
				&newListID,
				&cardID,
			)
			if websocket.GlobalHub != nil {
				websocket.GlobalHub.SendNotificationsToUsers(notifications)
			}
		}
	}()

	// Trigger webhook event
	if newList != nil && card != nil {
		go h.webhookService.TriggerEvent(services.EventCardMoved, &newList.BoardID, map[string]interface{}{
			"card_id":      card.ID.String(),
			"card_title":   card.Title,
			"from_list_id": card.ListID.String(),
			"to_list_id":   req.ListID.String(),
			"board_id":     newList.BoardID.String(),
			"user_id":      userID.String(),
		})
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

	// Get card info for notifications
	card, _ := h.service.GetByID(cardID, userID)

	// Notify board watchers about label change
	go func() {
		if card != nil {
			list, _ := h.listService.GetByID(card.ListID, userID)
			if list != nil {
				listID := card.ListID
				cID := cardID
				notifications, _ := h.notificationService.NotifyBoardWatchers(
					list.BoardID,
					userID,
					"label_added",
					"Label added",
					fmt.Sprintf("A label was added to card \"%s\"", card.Title),
					&listID,
					&cID,
				)
				if websocket.GlobalHub != nil {
					websocket.GlobalHub.SendNotificationsToUsers(notifications)
				}
			}
		}
	}()

	return utils.SuccessMessageResponse(c, "Label added successfully")
}

func (h *CardHandler) RemoveLabel(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	// Get card info before remove
	card, _ := h.service.GetByID(cardID, userID)

	labelID, err := uuid.Parse(c.Params("labelId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	if err := h.service.RemoveLabel(cardID, labelID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Notify board watchers about label removal
	go func() {
		if card != nil {
			list, _ := h.listService.GetByID(card.ListID, userID)
			if list != nil {
				listID := card.ListID
				cID := cardID
				notifications, _ := h.notificationService.NotifyBoardWatchers(
					list.BoardID,
					userID,
					"label_removed",
					"Label removed",
					fmt.Sprintf("A label was removed from card \"%s\"", card.Title),
					&listID,
					&cID,
				)
				if websocket.GlobalHub != nil {
					websocket.GlobalHub.SendNotificationsToUsers(notifications)
				}
			}
		}
	}()

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

	// Get card and list info for notifications
	card, _ := h.service.GetByID(cardID, userID)

	// Notify board watchers and the assigned member
	go func() {
		if card != nil {
			list, _ := h.listService.GetByID(card.ListID, userID)
			if list != nil {
				listID := card.ListID
				cID := cardID
				notifications, _ := h.notificationService.NotifyBoardWatchers(
					list.BoardID,
					userID,
					"member_assigned",
					"Member assigned",
					fmt.Sprintf("A member was assigned to card \"%s\"", card.Title),
					&listID,
					&cID,
				)
				if websocket.GlobalHub != nil {
					websocket.GlobalHub.SendNotificationsToUsers(notifications)
				}
			}
		}
	}()

	return utils.SuccessMessageResponse(c, "Member added successfully")
}

func (h *CardHandler) RemoveMember(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	// Get card info before remove
	card, _ := h.service.GetByID(cardID, userID)

	memberID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	if err := h.service.RemoveMember(cardID, memberID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Notify board watchers about member removal
	go func() {
		if card != nil {
			list, _ := h.listService.GetByID(card.ListID, userID)
			if list != nil {
				listID := card.ListID
				cID := cardID
				notifications, _ := h.notificationService.NotifyBoardWatchers(
					list.BoardID,
					userID,
					"member_removed",
					"Member removed",
					fmt.Sprintf("A member was removed from card \"%s\"", card.Title),
					&listID,
					&cID,
				)
				if websocket.GlobalHub != nil {
					websocket.GlobalHub.SendNotificationsToUsers(notifications)
				}
			}
		}
	}()

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

// GetMyCards returns all cards assigned to the current user with optional filters
func (h *CardHandler) GetMyCards(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	// Parse filter parameters
	var filter models.CardFilterRequest
	filter.Keyword = c.Query("keyword")

	if c.Query("is_complete") == "true" {
		isComplete := true
		filter.IsComplete = &isComplete
	}
	if c.Query("is_incomplete") == "true" {
		isIncomplete := true
		filter.IsIncomplete = &isIncomplete
	}

	filter.NoDueDate = c.Query("no_due_date") == "true"
	filter.Overdue = c.Query("overdue") == "true"
	filter.DueNextDay = c.Query("due_next_day") == "true"
	filter.DueNextWeek = c.Query("due_next_week") == "true"
	filter.DueNextMonth = c.Query("due_next_month") == "true"

	if boardIDs := c.Query("board_ids"); boardIDs != "" {
		filter.BoardIDs = strings.Split(boardIDs, ",")
	}

	filter.ActiveLastDay = c.Query("active_last_day") == "true"
	filter.ActiveLastWeek = c.Query("active_last_week") == "true"
	filter.ActiveLastMonth = c.Query("active_last_month") == "true"
	filter.ActiveLastYear = c.Query("active_last_year") == "true"

	cards, err := h.service.GetByAssignedUserID(userID, filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch cards")
	}

	return utils.SuccessResponse(c, cards)
}

// RefreshLinkPreview refreshes the link preview metadata for a card
func (h *CardHandler) RefreshLinkPreview(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	card, err := h.service.RefreshLinkPreview(cardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, card)
}

// ClearLinkPreview clears the link preview data for a card
func (h *CardHandler) ClearLinkPreview(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	card, err := h.service.ClearLinkPreview(cardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, card)
}

// FetchLinkPreview fetches link preview for a given URL (utility endpoint)
func (h *CardHandler) FetchLinkPreview(c *fiber.Ctx) error {
	var req struct {
		URL string `json:"url"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.URL == "" {
		return utils.ValidationErrorResponse(c, "URL is required")
	}

	if !h.linkPreviewService.IsURL(req.URL) {
		return utils.ValidationErrorResponse(c, "Invalid URL")
	}

	preview, err := h.linkPreviewService.FetchPreview(req.URL)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Failed to fetch link preview: "+err.Error())
	}

	return utils.SuccessResponse(c, preview)
}
