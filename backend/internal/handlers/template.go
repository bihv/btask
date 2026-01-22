package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/utils"
)

type TemplateHandler struct {
	service *services.TemplateService
}

func NewTemplateHandler(service *services.TemplateService) *TemplateHandler {
	return &TemplateHandler{service: service}
}

// GetAll returns all active templates (public endpoint)
func (h *TemplateHandler) GetAll(c *fiber.Ctx) error {
	params := models.TemplateListParams{
		Page:     c.QueryInt("page", 1),
		Limit:    c.QueryInt("limit", 20),
		Search:   c.Query("search"),
		Category: c.Query("category"),
	}

	if c.Query("is_featured") == "true" {
		featured := true
		params.IsFeatured = &featured
	}

	templates, total, err := h.service.GetAll(params, false)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to fetch templates")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"templates": templates,
		"total":     total,
		"page":      params.Page,
		"limit":     params.Limit,
	})
}

// GetByID returns a single template by ID (public endpoint)
func (h *TemplateHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid template ID")
	}

	template, err := h.service.GetByID(id)
	if err != nil {
		return utils.NotFoundResponse(c, "Template not found")
	}

	// Increment views
	go h.service.IncrementViews(id)

	return utils.SuccessResponse(c, template)
}

// AdminGetAll returns all templates including inactive (admin only)
func (h *TemplateHandler) AdminGetAll(c *fiber.Ctx) error {
	params := models.TemplateListParams{
		Page:     c.QueryInt("page", 1),
		Limit:    c.QueryInt("limit", 20),
		Search:   c.Query("search"),
		Category: c.Query("category"),
	}

	templates, total, err := h.service.GetAll(params, true)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to fetch templates")
	}

	return utils.SuccessResponse(c, fiber.Map{
		"templates": templates,
		"total":     total,
		"page":      params.Page,
		"limit":     params.Limit,
	})
}

// Create creates a new template (admin only)
func (h *TemplateHandler) Create(c *fiber.Ctx) error {
	var req models.CreateTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	userID := middleware.GetUserID(c)

	template, err := h.service.Create(req, userID)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to create template")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    template,
	})
}

// Update updates an existing template (admin only)
func (h *TemplateHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid template ID")
	}

	var req models.UpdateTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	template, err := h.service.Update(id, req)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to update template")
	}

	return utils.SuccessResponse(c, template)
}

// Delete deletes a template (admin only)
func (h *TemplateHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid template ID")
	}

	if err := h.service.Delete(id); err != nil {
		return utils.InternalErrorResponse(c, "Failed to delete template")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Template deleted"})
}

// UpdateLists updates the lists and cards of a template (admin only)
func (h *TemplateHandler) UpdateLists(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid template ID")
	}

	var req struct {
		Lists []models.CreateTemplateListInput `json:"lists"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := h.service.UpdateLists(id, req.Lists); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update template lists")
	}

	template, err := h.service.GetByID(id)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to fetch updated template")
	}

	return utils.SuccessResponse(c, template)
}

// IncrementCopies increments the copy count (called when user uses template)
func (h *TemplateHandler) IncrementCopies(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid template ID")
	}

	if err := h.service.IncrementCopies(id); err != nil {
		return utils.InternalErrorResponse(c, "Failed to update template")
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Copy count incremented"})
}
