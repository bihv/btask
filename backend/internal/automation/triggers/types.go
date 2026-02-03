// Package triggers provides the trigger matching framework for the automation engine.
// It follows the Registry Pattern allowing extensible, pluggable triggers.
//
// Architecture:
//
//	┌─────────────────────────────────────────────────────────────────┐
//	│                      TRIGGER FRAMEWORK                          │
//	├─────────────────────────────────────────────────────────────────┤
//	│                                                                 │
//	│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
//	│  │ TriggerMat- │    │  Trigger    │    │  TriggerRegistry    │ │
//	│  │   cher      │───▶│   Context   │◀───│  (singleton)        │ │
//	│  │ (interface) │    │             │    │                     │ │
//	│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
//	│         │                                        │             │
//	│         ▼                                        ▼             │
//	│  ┌─────────────┐                        ┌─────────────────┐   │
//	│  │ Concrete    │                        │ Match(event,cfg)│   │
//	│  │ Triggers    │                        │ FindMatching()  │   │
//	│  │ (card_moved,│                        │ List()          │   │
//	│  │  label_add) │                        └─────────────────┘   │
//	│  └─────────────┘                                              │
//	│                                                                │
//	└─────────────────────────────────────────────────────────────────┘
//
// Usage:
//
//	// Register a new trigger
//	triggers.Registry.Register(&CardAddedToListTrigger{})
//
//	// Find matching triggers for an event
//	matches := triggers.Registry.FindMatching(eventType, config)
package triggers

import (
	"github.com/google/uuid"
)

// ============================================================================
// TRIGGER CONTEXT - Information about the triggering event
// ============================================================================

// TriggerContext contains all the information about an event that may trigger automation.
type TriggerContext struct {
	// EventType is the type of event that occurred (e.g., "card.created", "card.moved")
	EventType string `json:"event_type"`

	// Entity IDs involved in the event
	CardID  uuid.UUID `json:"card_id,omitempty"`
	ListID  uuid.UUID `json:"list_id,omitempty"`
	BoardID uuid.UUID `json:"board_id"`
	UserID  uuid.UUID `json:"user_id,omitempty"` // User who caused the event

	// EventData contains additional event-specific data
	// Examples:
	// - For card.moved: old_list_id, new_list_id
	// - For label_added: label_id
	// - For member_added: member_id
	EventData map[string]interface{} `json:"event_data"`
}

// NewTriggerContext creates a TriggerContext from a raw context map.
func NewTriggerContext(eventType string, boardID uuid.UUID, data map[string]interface{}) TriggerContext {
	ctx := TriggerContext{
		EventType: eventType,
		BoardID:   boardID,
		EventData: data,
	}

	// Parse common IDs from data
	if cardIDStr, ok := data["card_id"].(string); ok {
		if cardID, err := uuid.Parse(cardIDStr); err == nil {
			ctx.CardID = cardID
		}
	}

	if listIDStr, ok := data["list_id"].(string); ok {
		if listID, err := uuid.Parse(listIDStr); err == nil {
			ctx.ListID = listID
		}
	}

	if userIDStr, ok := data["user_id"].(string); ok {
		if userID, err := uuid.Parse(userIDStr); err == nil {
			ctx.UserID = userID
		}
	}

	return ctx
}

// Get retrieves a value from EventData with type assertion.
func (c TriggerContext) Get(key string) interface{} {
	return c.EventData[key]
}

// GetString retrieves a string value from EventData.
func (c TriggerContext) GetString(key string) string {
	if val, ok := c.EventData[key].(string); ok {
		return val
	}
	return ""
}

// GetUUID retrieves a UUID value from EventData.
func (c TriggerContext) GetUUID(key string) uuid.UUID {
	if val, ok := c.EventData[key].(string); ok {
		if id, err := uuid.Parse(val); err == nil {
			return id
		}
	}
	return uuid.Nil
}

// ============================================================================
// TRIGGER SCHEMA - For UI Generation
// ============================================================================

// TriggerSchema defines the schema for a trigger's configuration.
// Similar to ActionSchema but for trigger-specific options.
type TriggerSchema struct {
	// Properties maps property names to their schemas
	Properties map[string]TriggerPropertySchema `json:"properties"`

	// Order specifies the order in which properties should be displayed
	Order []string `json:"order,omitempty"`
}

// TriggerPropertySchema defines a single property in a trigger config.
type TriggerPropertySchema struct {
	Type        string         `json:"type"`
	Required    bool           `json:"required"`
	Label       string         `json:"label"`
	Description string         `json:"description,omitempty"`
	UIWidget    string         `json:"ui_widget"`
	Options     []SelectOption `json:"options,omitempty"`
	Default     interface{}    `json:"default,omitempty"`
}

// SelectOption for dropdown/select widgets
type SelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// ============================================================================
// TRIGGER MATCHER INTERFACE
// ============================================================================

// TriggerMatcher is the interface that all triggers must implement.
// Each trigger knows:
// - What events it listens to
// - How to match against a specific event with configuration
// - What configuration options it accepts
type TriggerMatcher interface {
	// ID returns the unique identifier for this trigger.
	// This is used to match saved rule configs to trigger matchers.
	// Convention: lowercase, underscore-separated (e.g., "card_added_to_list")
	ID() string

	// Name returns the human-readable name for this trigger.
	// Displayed in the UI trigger picker.
	Name() string

	// Description returns a brief description of when this trigger fires.
	Description() string

	// Events returns the list of event types this trigger listens to.
	// Example: ["card.created", "card.moved"] for "card_added_to_list"
	Events() []string

	// Schema returns the configuration schema for this trigger.
	// Used by the frontend to generate configuration forms.
	Schema() TriggerSchema

	// SentenceTemplate returns a template for building a human-readable sentence.
	// Placeholders in {property_name} format will be replaced with actual values.
	// Example: "when a card is {verb} to list {list_id}"
	// This supports i18n - the template can be translated on the backend.
	SentenceTemplate() string

	// Match checks if the given event matches this trigger's conditions.
	// Parameters:
	// - ctx: The trigger context containing event information
	// - config: The trigger configuration from the saved rule
	// Returns true if the event should trigger the automation.
	Match(ctx TriggerContext, config map[string]interface{}) bool

	// Validate checks if the provided config is valid for this trigger.
	Validate(config map[string]interface{}) error
}

// ============================================================================
// TRIGGER CATEGORY - For UI Organization
// ============================================================================

// TriggerCategory groups related triggers together in the UI
type TriggerCategory string

const (
	TriggerCategoryCard   TriggerCategory = "card"
	TriggerCategoryList   TriggerCategory = "list"
	TriggerCategoryBoard  TriggerCategory = "board"
	TriggerCategoryLabel  TriggerCategory = "label"
	TriggerCategoryMember TriggerCategory = "member"
	TriggerCategoryDate   TriggerCategory = "date"
)

// TriggerMetadata provides additional metadata about a trigger
type TriggerMetadata struct {
	Category TriggerCategory `json:"category"`
	Icon     string          `json:"icon"`
}

// TriggerMatcherWithMetadata extends TriggerMatcher with metadata
type TriggerMatcherWithMetadata interface {
	TriggerMatcher
	Metadata() TriggerMetadata
}

// ============================================================================
// TRIGGER INFO DTO - For API responses
// ============================================================================

// TriggerInfo contains the serializable information about a trigger.
type TriggerInfo struct {
	ID               string           `json:"id"`
	Name             string           `json:"name"`
	Description      string           `json:"description"`
	Events           []string         `json:"events"`
	Schema           TriggerSchema    `json:"schema"`
	SentenceTemplate string           `json:"sentence_template,omitempty"`
	Metadata         *TriggerMetadata `json:"metadata,omitempty"`
}
