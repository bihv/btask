package triggerhandlers

import (
	"log"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/events"
	"github.com/mello/backend/internal/services"
)

// ============================================================================
// CARD TRIGGER HANDLER - Salesforce-style Trigger (separated from business logic)
// ============================================================================

// CardTriggerHandler subscribes to card domain events and forwards them
// to the AutomationService for rule matching and action execution.
// This is the "Trigger" in Salesforce terminology — it sits between
// the business logic (CardService) and the automation engine (AutomationService).
type CardTriggerHandler struct {
	automationService *services.AutomationService
}

// NewCardTriggerHandler creates a new CardTriggerHandler.
func NewCardTriggerHandler(automationService *services.AutomationService) *CardTriggerHandler {
	return &CardTriggerHandler{
		automationService: automationService,
	}
}

// Register subscribes this handler to all card events on the EventBus.
func (h *CardTriggerHandler) Register(bus *events.EventBus) {
	bus.Subscribe("card.created", h.handleEvent)
	bus.Subscribe("card.moved", h.handleEvent)
	bus.Subscribe("card.due_date_changed", h.handleEvent)
	bus.Subscribe("card.completed", h.handleEvent)
	bus.Subscribe("card.incomplete", h.handleEvent)
	bus.Subscribe("card.label_added", h.handleEvent)
	bus.Subscribe("card.label_removed", h.handleEvent)
	bus.Subscribe("card.member_added", h.handleEvent)
	bus.Subscribe("card.member_removed", h.handleEvent)
	bus.Subscribe("card.archived", h.handleEvent)
	bus.Subscribe("card.unarchived", h.handleEvent)

	log.Println("[CardTriggerHandler] Registered for all card events")
}

// handleEvent is the unified handler for all card events.
// It extracts boardID from the event data and forwards to AutomationService.ProcessEvent.
func (h *CardTriggerHandler) handleEvent(event events.DomainEvent) {
	ctx := event.GetContext()
	eventData := event.ToMap()

	// Extract boardID from event data
	boardIDStr, ok := eventData["board_id"].(string)
	if !ok {
		log.Printf("[CardTriggerHandler] ⚠️ Event '%s' missing board_id, skipping", event.EventName())
		return
	}

	boardID, err := uuid.Parse(boardIDStr)
	if err != nil {
		log.Printf("[CardTriggerHandler] ⚠️ Event '%s' has invalid board_id: %s", event.EventName(), boardIDStr)
		return
	}

	// Log context for debugging
	if ctx.IsAutomationExecution {
		log.Printf("[CardTriggerHandler] 🔄 Cascade event '%s' (depth=%d, source_rule=%s)",
			event.EventName(), ctx.Depth, ctx.SourceRuleID)
	} else {
		log.Printf("[CardTriggerHandler] 📥 User event '%s' (board=%s)",
			event.EventName(), boardID)
	}

	// Forward to AutomationService — the rule engine handles matching and execution
	h.automationService.ProcessEvent(event.EventName(), boardID, eventData)
}
