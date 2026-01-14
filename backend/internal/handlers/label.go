package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/pkg/utils"
)

type LabelHandler struct {
	labelRepo     *repository.LabelRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewLabelHandler() *LabelHandler {
	return &LabelHandler{
		labelRepo:     repository.NewLabelRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (h *LabelHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	board, err := h.boardRepo.FindByID(boardID)
	if err != nil {
		return utils.NotFoundResponse(c, "Board not found")
	}

	if !h.hasAccess(board.WorkspaceID, userID) {
		return utils.UnauthorizedResponse(c, "Access denied")
	}

	var req models.CreateLabelRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Color == "" {
		return utils.ValidationErrorResponse(c, "Color is required")
	}

	label := &models.Label{
		BoardID: boardID,
		Name:    req.Name,
		Color:   req.Color,
	}

	if err := h.labelRepo.Create(label); err != nil {
		return utils.InternalErrorResponse(c, "Failed to create label")
	}

	return utils.SuccessResponse(c, label)
}

func (h *LabelHandler) GetByBoardID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	board, err := h.boardRepo.FindByID(boardID)
	if err != nil {
		return utils.NotFoundResponse(c, "Board not found")
	}

	if !h.hasAccess(board.WorkspaceID, userID) {
		return utils.UnauthorizedResponse(c, "Access denied")
	}

	labels, err := h.labelRepo.FindByBoardID(boardID)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to get labels")
	}

	return utils.SuccessResponse(c, labels)
}

func (h *LabelHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	label, err := h.labelRepo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "Label not found")
	}

	board, err := h.boardRepo.FindByID(label.BoardID)
	if err != nil {
		return utils.NotFoundResponse(c, "Board not found")
	}

	if !h.hasAccess(board.WorkspaceID, userID) {
		return utils.UnauthorizedResponse(c, "Access denied")
	}

	var req models.UpdateLabelRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Name != "" {
		label.Name = req.Name
	}
	if req.Color != "" {
		label.Color = req.Color
	}

	if err := h.labelRepo.Update(label); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update label")
	}

	return utils.SuccessResponse(c, label)
}

func (h *LabelHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid label ID")
	}

	label, err := h.labelRepo.FindByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "Label not found")
	}

	board, err := h.boardRepo.FindByID(label.BoardID)
	if err != nil {
		return utils.NotFoundResponse(c, "Board not found")
	}

	if !h.hasAccess(board.WorkspaceID, userID) {
		return utils.UnauthorizedResponse(c, "Access denied")
	}

	if err := h.labelRepo.Delete(id); err != nil {
		return utils.InternalErrorResponse(c, "Failed to delete label")
	}

	return utils.SuccessMessageResponse(c, "Label deleted successfully")
}

func (h *LabelHandler) hasAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return h.workspaceRepo.IsOwner(workspaceID, userID) || h.workspaceRepo.IsMember(workspaceID, userID)
}
