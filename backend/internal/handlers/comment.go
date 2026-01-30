package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/internal/websocket"
	"github.com/mello/backend/pkg/utils"
)

type CommentHandler struct {
	service             *services.CommentService
	cardService         *services.CardService
	listService         *services.ListService
	notificationService *services.NotificationService
}

func NewCommentHandler() *CommentHandler {
	return &CommentHandler{
		service:             services.NewCommentService(),
		cardService:         services.NewCardService(services.NewAutomationService()),
		listService:         services.NewListService(),
		notificationService: services.NewNotificationService(),
	}
}

func (h *CommentHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	var req models.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Content == "" {
		return utils.ValidationErrorResponse(c, "Content is required")
	}

	comment, err := h.service.Create(cardID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Get card and list info for notifications
	card, _ := h.cardService.GetByID(cardID, userID)

	// Notify board watchers about new comment
	go func() {
		if card != nil {
			list, _ := h.listService.GetByID(card.ListID, userID)
			if list != nil {
				listID := card.ListID
				cID := cardID
				notifications, _ := h.notificationService.NotifyBoardWatchers(
					list.BoardID,
					userID,
					"comment_added",
					"New comment",
					fmt.Sprintf("New comment on card \"%s\"", card.Title),
					&listID,
					&cID,
				)
				if websocket.GlobalHub != nil {
					websocket.GlobalHub.SendNotificationsToUsers(notifications)
				}
			}
		}
	}()

	return utils.SuccessResponse(c, comment)
}

func (h *CommentHandler) GetByCardID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	comments, err := h.service.GetByCardID(cardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, comments)
}

func (h *CommentHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid comment ID")
	}

	var req models.UpdateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	comment, err := h.service.Update(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, comment)
}

func (h *CommentHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid comment ID")
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Comment deleted successfully")
}
