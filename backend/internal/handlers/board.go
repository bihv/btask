package handlers

import (
	"github.com/btask/backend/internal/middleware"
	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/services"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BoardHandler struct {
	service *services.BoardService
}

func NewBoardHandler() *BoardHandler {
	return &BoardHandler{
		service: services.NewBoardService(),
	}
}

func (h *BoardHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	workspaceID, err := uuid.Parse(c.Params("workspaceId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	var req models.CreateBoardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Title == "" {
		return utils.ValidationErrorResponse(c, "Title is required")
	}

	board, err := h.service.Create(workspaceID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, board)
}

func (h *BoardHandler) GetByWorkspace(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	workspaceID, err := uuid.Parse(c.Params("workspaceId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	boards, err := h.service.GetByWorkspaceID(workspaceID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, boards)
}

func (h *BoardHandler) GetByID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	board, err := h.service.GetByID(id, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	// Add is_watching to response
	isWatching := h.service.IsWatching(id, userID)

	return utils.SuccessResponse(c, fiber.Map{
		"id":               board.ID,
		"workspace_id":     board.WorkspaceID,
		"title":            board.Title,
		"description":      board.Description,
		"background_color": board.BackgroundColor,
		"background_image": board.BackgroundImage,
		"is_starred":       board.IsStarred,
		"show_card_covers": board.ShowCardCovers,
		"is_watching":      isWatching,
		"position":         board.Position,
		"lists":            board.Lists,
		"labels":           board.Labels,
		"created_at":       board.CreatedAt,
		"updated_at":       board.UpdatedAt,
	})
}

func (h *BoardHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	var req models.UpdateBoardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	board, err := h.service.Update(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, board)
}

func (h *BoardHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Board deleted successfully")
}

func (h *BoardHandler) Copy(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	var req models.CopyBoardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Title == "" {
		return utils.ValidationErrorResponse(c, "Title is required")
	}

	board, err := h.service.Copy(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, board)
}

func (h *BoardHandler) Watch(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	if err := h.service.Watch(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Board watched successfully")
}

func (h *BoardHandler) Unwatch(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	if err := h.service.Unwatch(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Board unwatched successfully")
}

func (h *BoardHandler) IsWatching(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	isWatching := h.service.IsWatching(id, userID)

	return utils.SuccessResponse(c, fiber.Map{"is_watching": isWatching})
}
