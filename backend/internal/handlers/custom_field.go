package handlers

import (
	"github.com/btask/backend/internal/middleware"
	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/services"
	"github.com/btask/backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CustomFieldHandler struct {
	service *services.CustomFieldService
}

func NewCustomFieldHandler() *CustomFieldHandler {
	return &CustomFieldHandler{
		service: services.NewCustomFieldService(),
	}
}

// Create creates a new custom field for a board
func (h *CustomFieldHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	var req models.CreateCustomFieldRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Name == "" {
		return utils.ValidationErrorResponse(c, "Name is required")
	}

	if req.Type == "" {
		return utils.ValidationErrorResponse(c, "Type is required")
	}

	field, err := h.service.Create(boardID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, field)
}

// GetByBoardID returns all custom fields for a board
func (h *CustomFieldHandler) GetByBoardID(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	fields, err := h.service.GetByBoardID(boardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, fields)
}

// Update updates a custom field
func (h *CustomFieldHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	fieldID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid custom field ID")
	}

	var req models.UpdateCustomFieldRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	field, err := h.service.Update(fieldID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, field)
}

// Delete deletes a custom field
func (h *CustomFieldHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	fieldID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid custom field ID")
	}

	if err := h.service.Delete(fieldID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Custom field deleted successfully")
}

// AddDefaultField adds a default/suggested field to a board
func (h *CustomFieldHandler) AddDefaultField(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid board ID")
	}

	var req models.AddDefaultFieldRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.FieldName == "" {
		return utils.ValidationErrorResponse(c, "Field name is required")
	}

	field, err := h.service.AddDefaultField(boardID, userID, req.FieldName)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, field)
}

// AddOption adds an option to a dropdown field
func (h *CustomFieldHandler) AddOption(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	fieldID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid custom field ID")
	}

	var req models.AddCustomFieldOptionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Value == "" {
		return utils.ValidationErrorResponse(c, "Option value is required")
	}

	option, err := h.service.AddOption(fieldID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, option)
}

// UpdateOption updates an option
func (h *CustomFieldHandler) UpdateOption(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	optionID, err := uuid.Parse(c.Params("optionId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid option ID")
	}

	var req models.AddCustomFieldOptionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	if req.Value == "" {
		return utils.ValidationErrorResponse(c, "Option value is required")
	}

	option, err := h.service.UpdateOption(optionID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, option)
}

// DeleteOption deletes an option
func (h *CustomFieldHandler) DeleteOption(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	optionID, err := uuid.Parse(c.Params("optionId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid option ID")
	}

	if err := h.service.DeleteOption(optionID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Option deleted successfully")
}

// SetCardValue sets a custom field value for a card
func (h *CustomFieldHandler) SetCardValue(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	fieldID, err := uuid.Parse(c.Params("fieldId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid custom field ID")
	}

	var req models.SetCardCustomFieldValueRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, "Invalid request body")
	}

	value, err := h.service.SetCardValue(cardID, fieldID, userID, req)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, value)
}

// GetCardValues gets all custom field values for a card
func (h *CustomFieldHandler) GetCardValues(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	values, err := h.service.GetCardValues(cardID, userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	}

	return utils.SuccessResponse(c, values)
}

// ClearCardValue clears a custom field value from a card
func (h *CustomFieldHandler) ClearCardValue(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	cardID, err := uuid.Parse(c.Params("cardId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid card ID")
	}

	fieldID, err := uuid.Parse(c.Params("fieldId"))
	if err != nil {
		return utils.ValidationErrorResponse(c, "Invalid custom field ID")
	}

	if err := h.service.ClearCardValue(cardID, fieldID, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessMessageResponse(c, "Custom field value cleared")
}
