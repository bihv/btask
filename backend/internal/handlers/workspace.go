package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type WorkspaceHandler struct {
	service *services.WorkspaceService
}

func NewWorkspaceHandler() *WorkspaceHandler {
	return &WorkspaceHandler{
		service: services.NewWorkspaceService(),
	}
}

func (h *WorkspaceHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req models.CreateWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Name == "" {
		return utils.ValidationErrorResponse(c, "Name is required")
	}

	workspace, err := h.service.Create(userID, req)
	if err != nil {
		return utils.InternalErrorResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, workspace)
}

func (h *WorkspaceHandler) GetAll(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	workspaces, err := h.service.GetUserWorkspaces(userID)
	if err != nil {
		return utils.InternalErrorResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, workspaces)
}

func (h *WorkspaceHandler) GetByID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	workspace, err := h.service.GetByID(id, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, workspace)
}

func (h *WorkspaceHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	var req models.UpdateWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	workspace, err := h.service.Update(id, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, workspace)
}

func (h *WorkspaceHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	if err := h.service.Delete(id, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Workspace deleted successfully")
}

func (h *WorkspaceHandler) InviteMember(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	var req struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Email == "" {
		return utils.ValidationErrorResponse(c, "Email is required")
	}

	if err := h.service.AddMemberByEmail(id, userID, req.Email, req.Role); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Member invited successfully")
}

func (h *WorkspaceHandler) RemoveMember(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	workspaceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	memberID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid user ID")
	}

	if err := h.service.RemoveMember(workspaceID, userID, memberID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Member removed successfully")
}

func (h *WorkspaceHandler) GetMembers(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid workspace ID")
	}

	members, err := h.service.GetMembers(id, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, members)
}
