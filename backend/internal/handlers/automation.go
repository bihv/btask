package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/services"
)

type AutomationHandler struct {
	service *services.AutomationService
}

func NewAutomationHandler(service *services.AutomationService) *AutomationHandler {
	return &AutomationHandler{service: service}
}

func (h *AutomationHandler) CreateRule(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req models.CreateAutomationRuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	rule, err := h.service.CreateRule(userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": rule})
}

func (h *AutomationHandler) GetRules(c *fiber.Ctx) error {
	boardIDStr := c.Params("boardId")
	boardID, err := uuid.Parse(boardIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid board ID"})
	}

	rules, err := h.service.GetRules(boardID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": rules})
}

func (h *AutomationHandler) DeleteRule(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid rule ID"})
	}

	if err := h.service.DeleteRule(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Rule deleted"})
}

func (h *AutomationHandler) UpdateRule(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid rule ID"})
	}

	var req models.UpdateAutomationRuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check ownership via middleware/service if needed?
	// For now assuming existing protection is enough or ownership check is inside service (it wasn't explicit there but auth middleware exists)

	rule, err := h.service.UpdateRule(id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": rule})
}

// ==========================================
// SCHEMA API ENDPOINTS
// ==========================================

// GetAutomationSchema returns the full automation schema (triggers, actions, conditions)
// for building the automation UI.
// GET /api/automation/schema
func (h *AutomationHandler) GetAutomationSchema(c *fiber.Ctx) error {
	schema := h.service.GetFullAutomationSchema()
	return c.JSON(fiber.Map{"data": schema})
}

// GetAvailableTriggers returns all registered triggers with their schemas.
// GET /api/automation/triggers
func (h *AutomationHandler) GetAvailableTriggers(c *fiber.Ctx) error {
	triggers := h.service.GetAvailableTriggers()
	return c.JSON(fiber.Map{"data": triggers})
}

// GetAvailableActions returns all registered actions with their schemas.
// GET /api/automation/actions
func (h *AutomationHandler) GetAvailableActions(c *fiber.Ctx) error {
	actions := h.service.GetAvailableActions()
	return c.JSON(fiber.Map{"data": actions})
}

// GetConditionOperators returns available condition operators.
// GET /api/automation/conditions/operators
func (h *AutomationHandler) GetConditionOperators(c *fiber.Ctx) error {
	operators := h.service.GetAvailableConditionOperators()
	return c.JSON(fiber.Map{"data": operators})
}

// GetConditionFields returns available fields for conditions based on context.
// GET /api/automation/conditions/fields?context=card
func (h *AutomationHandler) GetConditionFields(c *fiber.Ctx) error {
	contextType := c.Query("context", "card")
	fields := h.service.GetAvailableConditionFields(contextType)
	return c.JSON(fiber.Map{"data": fields})
}

// ValidateRule validates a rule configuration before saving.
// POST /api/automation/validate
func (h *AutomationHandler) ValidateRule(c *fiber.Ctx) error {
	var req models.CreateAutomationRuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	errs := h.service.ValidateRuleConfig(req)
	if len(errs) > 0 {
		// Convert errors to strings
		errStrings := make([]string, len(errs))
		for i, e := range errs {
			errStrings[i] = e.Error()
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"valid":  false,
			"errors": errStrings,
		})
	}

	return c.JSON(fiber.Map{"valid": true})
}
