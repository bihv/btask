package handlers

import (
	"github.com/btask/backend/internal/middleware"
	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/services"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CommentHandler struct {
	service *services.CommentService
}

func NewCommentHandler() *CommentHandler {
	return &CommentHandler{
		service: services.NewCommentService(),
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
