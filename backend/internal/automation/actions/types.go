// Package actions provides the action execution framework for the automation engine.
// It follows the Registry Pattern allowing extensible, pluggable actions.
//
// Architecture:
//
//	┌─────────────────────────────────────────────────────────────────┐
//	│                      ACTION FRAMEWORK                           │
//	├─────────────────────────────────────────────────────────────────┤
//	│                                                                 │
//	│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
//	│  │ ActionExec- │    │   Action    │    │  ActionRegistry     │ │
//	│  │   utor      │───▶│   Context   │◀───│  (singleton)        │ │
//	│  │ (interface) │    │             │    │                     │ │
//	│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
//	│         │                                        │             │
//	│         ▼                                        ▼             │
//	│  ┌─────────────┐                        ┌─────────────────┐   │
//	│  │ Concrete    │                        │ Execute(id,ctx) │   │
//	│  │ Actions     │                        │ List()          │   │
//	│  │ (move_card, │                        │ Get(id)         │   │
//	│  │  add_label) │                        └─────────────────┘   │
//	│  └─────────────┘                                              │
//	│                                                                │
//	└─────────────────────────────────────────────────────────────────┘
//
// Usage:
//
//	// Register a new action
//	actions.Registry.Register(&MoveCardAction{cardRepo: repo})
//
//	// Execute an action
//	result := actions.Registry.Execute("move_card", ctx)
package actions

import (
	"github.com/google/uuid"
)

// ActionContext contains all the information needed to execute an action.
// It provides both the trigger context (what caused this action) and
// the action-specific configuration (how to execute).
type ActionContext struct {
	// Entity IDs - the target entities for this action
	CardID  uuid.UUID `json:"card_id"`
	ListID  uuid.UUID `json:"list_id"`
	BoardID uuid.UUID `json:"board_id"`
	UserID  uuid.UUID `json:"user_id"` // User who triggered the automation

	// TriggerData contains the original event data that triggered this action.
	// Useful for accessing additional context like old values, timestamps, etc.
	TriggerData map[string]interface{} `json:"trigger_data"`

	// Config contains the action-specific configuration.
	// Each action type defines its own expected config structure.
	// Example for move_card: {"list_id": "uuid-here"}
	Config map[string]interface{} `json:"config"`
}

// ActionResult represents the outcome of an action execution.
type ActionResult struct {
	// Success indicates whether the action completed successfully
	Success bool `json:"success"`

	// Message provides a human-readable description of the result
	Message string `json:"message"`

	// Data contains any output data from the action.
	// Can be used by subsequent actions in a workflow.
	Data map[string]interface{} `json:"data,omitempty"`

	// Error contains the error if Success is false
	Error error `json:"error,omitempty"`

	// AffectedEntities lists the IDs of entities modified by this action
	AffectedEntities []uuid.UUID `json:"affected_entities,omitempty"`
}

// NewSuccessResult creates a successful ActionResult with a message
func NewSuccessResult(message string) ActionResult {
	return ActionResult{
		Success: true,
		Message: message,
	}
}

// NewSuccessResultWithData creates a successful ActionResult with data
func NewSuccessResultWithData(message string, data map[string]interface{}) ActionResult {
	return ActionResult{
		Success: true,
		Message: message,
		Data:    data,
	}
}

// NewErrorResult creates a failed ActionResult from an error
func NewErrorResult(err error) ActionResult {
	return ActionResult{
		Success: false,
		Message: err.Error(),
		Error:   err,
	}
}

// NewErrorResultWithMessage creates a failed ActionResult with a custom message
func NewErrorResultWithMessage(message string, err error) ActionResult {
	return ActionResult{
		Success: false,
		Message: message,
		Error:   err,
	}
}

// ============================================================================
// ACTION SCHEMA - For UI Generation & Validation
// ============================================================================

// UIWidgetType defines the type of UI widget to render for a property
type UIWidgetType string

const (
	UIWidgetText        UIWidgetType = "text"
	UIWidgetTextarea    UIWidgetType = "textarea"
	UIWidgetNumber      UIWidgetType = "number"
	UIWidgetSelect      UIWidgetType = "select"
	UIWidgetListPicker  UIWidgetType = "list_picker"
	UIWidgetLabelPicker UIWidgetType = "label_picker"
	UIWidgetUserPicker  UIWidgetType = "user_picker"
	UIWidgetDatePicker  UIWidgetType = "date_picker"
	UIWidgetCheckbox    UIWidgetType = "checkbox"
)

// PropertyType defines the data type of a property
type PropertyType string

const (
	PropertyTypeString  PropertyType = "string"
	PropertyTypeNumber  PropertyType = "number"
	PropertyTypeBoolean PropertyType = "boolean"
	PropertyTypeArray   PropertyType = "array"
	PropertyTypeObject  PropertyType = "object"
)

// SelectOption represents an option in a select/dropdown widget
type SelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// PropertySchema defines the schema for a single property in an action config
type PropertySchema struct {
	// Type is the data type (string, number, boolean, array, object)
	Type PropertyType `json:"type"`

	// Required indicates if this property must be provided
	Required bool `json:"required"`

	// Label is the human-readable name shown in the UI
	Label string `json:"label"`

	// Description provides additional context for the user
	Description string `json:"description,omitempty"`

	// Placeholder is the placeholder text for input fields
	Placeholder string `json:"placeholder,omitempty"`

	// UIWidget specifies which UI component to render
	UIWidget UIWidgetType `json:"ui_widget"`

	// Options are the available choices for select widgets
	Options []SelectOption `json:"options,omitempty"`

	// Default is the default value if not provided
	Default interface{} `json:"default,omitempty"`

	// Validation rules
	MinLength *int     `json:"min_length,omitempty"`
	MaxLength *int     `json:"max_length,omitempty"`
	Min       *float64 `json:"min,omitempty"`
	Max       *float64 `json:"max,omitempty"`
	Pattern   string   `json:"pattern,omitempty"` // Regex pattern for validation
}

// ActionSchema defines the complete schema for an action's configuration
type ActionSchema struct {
	// Properties maps property names to their schemas
	Properties map[string]PropertySchema `json:"properties"`

	// Order specifies the order in which properties should be displayed
	Order []string `json:"order,omitempty"`
}

// ============================================================================
// ACTION EXECUTOR INTERFACE
// ============================================================================

// ActionExecutor is the interface that all actions must implement.
// Each action is a self-contained unit that knows how to:
// - Identify itself (ID, Name, Description)
// - Describe its configuration schema (Schema)
// - Execute the action (Execute)
// - Optionally validate configuration (Validate)
type ActionExecutor interface {
	// ID returns the unique identifier for this action.
	// This is used to match action configs to executors.
	// Convention: lowercase, underscore-separated (e.g., "move_card", "add_label")
	ID() string

	// Name returns the human-readable name for this action.
	// Displayed in the UI action picker.
	Name() string

	// Description returns a brief description of what this action does.
	// Shown as helper text in the UI.
	Description() string

	// Schema returns the JSON Schema for this action's configuration.
	// Used by the frontend to generate configuration forms.
	Schema() ActionSchema

	// SentenceTemplate returns a template for building a human-readable sentence.
	// Placeholders in {property_name} format will be replaced with actual values.
	// Example: "move card to list {list_id}"
	// This supports i18n - the template can be translated on the backend.
	SentenceTemplate() string

	// Execute performs the action with the given context.
	// Should be idempotent when possible.
	Execute(ctx ActionContext) ActionResult

	// Validate checks if the provided config is valid for this action.
	// Called before saving a rule to catch errors early.
	// Returns nil if valid, error with details if invalid.
	Validate(config map[string]interface{}) error
}

// ============================================================================
// ACTION CATEGORY - For UI Organization
// ============================================================================

// ActionCategory groups related actions together in the UI
type ActionCategory string

const (
	CategoryCard         ActionCategory = "card"
	CategoryList         ActionCategory = "list"
	CategoryLabel        ActionCategory = "label"
	CategoryMember       ActionCategory = "member"
	CategoryNotification ActionCategory = "notification"
	CategoryIntegration  ActionCategory = "integration"
)

// ActionMetadata provides additional metadata about an action
type ActionMetadata struct {
	// Category for grouping in the UI
	Category ActionCategory `json:"category"`

	// Icon name (e.g., "move", "label", "user")
	Icon string `json:"icon"`

	// Color for the action chip/badge
	Color string `json:"color,omitempty"`

	// IsDestructive indicates if this action can cause data loss
	IsDestructive bool `json:"is_destructive"`

	// RequiresConfirmation indicates if the UI should confirm before executing
	RequiresConfirmation bool `json:"requires_confirmation"`
}

// ActionExecutorWithMetadata extends ActionExecutor with additional metadata
type ActionExecutorWithMetadata interface {
	ActionExecutor
	Metadata() ActionMetadata
}
