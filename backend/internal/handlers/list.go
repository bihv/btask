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

type ListHandler struct {
	service             *services.ListService
	notificationService *services.NotificationService
}

func NewListHandler() *ListHandler {
	return &ListHandler{
		service:             services.NewListService(),
		notificationService: services.NewNotificationService(),
	}
}

func (h *ListHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	var req models.CreateListRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Title == "" {
		return utils.ValidationErrorResponse(c, "Title is required")
	}

	list, err := h.service.Create(boardID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Notify board watchers about new list
	go func() {
		listID := list.ID
		notifications, _ := h.notificationService.NotifyBoardWatchers(
			boardID,
			userID,
			"list_created",
			"New list created",
			fmt.Sprintf("List \"%s\" was created", list.Title),
			&listID,
			nil,
		)
		if websocket.GlobalHub != nil {
			websocket.GlobalHub.SendNotificationsToUsers(notifications)
		}
	}()

	return utils.SuccessResponse(c, list)
}

func (h *ListHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	var req models.UpdateListRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	list, err := h.service.Update(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, list)
}

func (h *ListHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "List deleted successfully")
}

func (h *ListHandler) Move(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	var req models.MoveListRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.Move(id, userID, req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "List moved successfully")
}

func (h *ListHandler) Copy(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	var req models.CopyListRequest
	c.BodyParser(&req) // Ignore error - title is optional

	list, err := h.service.Copy(id, userID, req.Title)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, list)
}

func (h *ListHandler) MoveAllCards(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	sourceListID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid source list ID")
	}

	var req models.MoveAllCardsRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	targetListID, err := uuid.Parse(req.TargetListID)
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid target list ID")
	}

	if err := h.service.MoveAllCards(sourceListID, targetListID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "All cards moved successfully")
}

func (h *ListHandler) SortCards(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	var req models.SortCardsRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.SortBy == "" {
		return utils.ValidationErrorResponse(c, "Sort type is required")
	}

	if err := h.service.SortCards(listID, userID, req.SortBy); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Cards sorted successfully")
}

func (h *ListHandler) Archive(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	// Get list info before archive
	list, _ := h.service.GetByID(listID, userID)

	if err := h.service.Archive(listID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Notify board watchers about list archive
	go func() {
		if list != nil {
			lID := listID
			notifications, _ := h.notificationService.NotifyBoardWatchers(
				list.BoardID,
				userID,
				"list_archived",
				"List archived",
				fmt.Sprintf("List \"%s\" was archived", list.Title),
				&lID,
				nil,
			)
			if websocket.GlobalHub != nil {
				websocket.GlobalHub.SendNotificationsToUsers(notifications)
			}
		}
	}()

	return utils.SuccessMessageResponse(c, "List archived successfully")
}

func (h *ListHandler) Unarchive(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	if err := h.service.Unarchive(listID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "List restored successfully")
}

func (h *ListHandler) ArchiveAllCards(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	listID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid list ID")
	}

	if err := h.service.ArchiveAllCards(listID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "All cards archived successfully")
}

func (h *ListHandler) GetArchivedLists(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	lists, err := h.service.GetArchivedByBoardID(boardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, lists)
}

func (h *ListHandler) ExpandAllLists(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	if err := h.service.ExpandAllLists(boardID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "All lists expanded")
}

func (h *ListHandler) CollapseAllLists(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	if err := h.service.CollapseAllLists(boardID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "All lists collapsed")
}
