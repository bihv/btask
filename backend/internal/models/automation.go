package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AutomationRule struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	PluginID      *uuid.UUID `json:"plugin_id" gorm:"type:uuid;index"`
	WorkspaceID   *uuid.UUID `json:"workspace_id" gorm:"type:uuid;index"`
	BoardID       *uuid.UUID `json:"board_id" gorm:"type:uuid;index"`
	Name          string     `json:"name" gorm:"not null"`
	Description   string     `json:"description"`
	TriggerType   string     `json:"trigger_type" gorm:"not null"` // event, schedule, manual
	TriggerConfig JSONMap    `json:"trigger_config" gorm:"type:jsonb;not null"`
	Actions       JSONArray  `json:"actions" gorm:"type:jsonb;not null"`
	IsEnabled     bool       `json:"is_enabled" gorm:"default:true;index"`
	CreatedBy     *uuid.UUID `json:"created_by" gorm:"type:uuid"`
	RunCount      int        `json:"run_count" gorm:"default:0"`
	LastRunAt     *time.Time `json:"last_run_at"`
	LastError     string     `json:"last_error"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Relations
	Plugin    *Plugin         `json:"plugin,omitempty" gorm:"foreignKey:PluginID"`
	Workspace *Workspace      `json:"workspace,omitempty" gorm:"foreignKey:WorkspaceID"`
	Board     *Board          `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Creator   *User           `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Runs      []AutomationRun `json:"runs,omitempty" gorm:"foreignKey:RuleID;constraint:OnDelete:CASCADE;"`
}

func (ar *AutomationRule) BeforeCreate(tx *gorm.DB) error {
	if ar.ID == uuid.Nil {
		ar.ID = uuid.New()
	}
	return nil
}

// AutomationRun represents a single execution of an automation rule
type AutomationRun struct {
	ID               uuid.UUID              `json:"id" gorm:"type:uuid;primary_key"`
	RuleID           uuid.UUID              `json:"rule_id" gorm:"type:uuid;not null;index"`
	TriggerEvent     map[string]interface{} `json:"trigger_event" gorm:"type:jsonb"`
	AffectedEntities []interface{}          `json:"affected_entities" gorm:"type:jsonb"`
	Status           string                 `json:"status" gorm:"not null;index"` // success, partial, failed
	ActionsExecuted  []interface{}          `json:"actions_executed" gorm:"type:jsonb"`
	ErrorMessage     string                 `json:"error_message"`
	StartedAt        time.Time              `json:"started_at"`
	CompletedAt      *time.Time             `json:"completed_at"`

	// Relations
	Rule AutomationRule `json:"-" gorm:"foreignKey:RuleID"`
}

func (ar *AutomationRun) BeforeCreate(tx *gorm.DB) error {
	if ar.ID == uuid.Nil {
		ar.ID = uuid.New()
	}
	return nil
}

// Request/Response DTOs
type CreateAutomationRuleRequest struct {
	Name          string    `json:"name" validate:"required,min=3,max=200"`
	Description   string    `json:"description" validate:"max=1000"`
	TriggerType   string    `json:"trigger_type" validate:"required,oneof=event schedule manual"`
	TriggerConfig JSONMap   `json:"trigger_config" validate:"required"`
	Actions       JSONArray `json:"actions" validate:"required,min=1"`
	WorkspaceID   *string   `json:"workspace_id"`
	BoardID       *string   `json:"board_id"`
}

type UpdateAutomationRuleRequest struct {
	Name          string    `json:"name" validate:"omitempty,min=3,max=200"`
	Description   string    `json:"description" validate:"max=1000"`
	TriggerConfig JSONMap   `json:"trigger_config"`
	Actions       JSONArray `json:"actions" validate:"omitempty,min=1"`
	IsEnabled     *bool     `json:"is_enabled"`
}

type TriggerAutomationRequest struct {
	Context map[string]interface{} `json:"context"`
}

// Automation Trigger Types
type EventTriggerConfig struct {
	Event      string                `json:"event"`      // card.moved, card.created, etc.
	Conditions []AutomationCondition `json:"conditions"` // Optional conditions
}

type ScheduleTriggerConfig struct {
	Cron     string `json:"cron"`     // Cron expression
	Timezone string `json:"timezone"` // e.g., Asia/Ho_Chi_Minh
}

type ManualTriggerConfig struct {
	ButtonText string `json:"button_text"`
	ButtonIcon string `json:"button_icon"`
}

// Automation Conditions
type AutomationCondition struct {
	Field    string      `json:"field"`    // list.name, card.label, etc.
	Operator string      `json:"operator"` // equals, contains, gt, lt, etc.
	Value    interface{} `json:"value"`
}

// Automation Actions
type MoveCardAction struct {
	Type   string `json:"type"` // move_card
	ListID string `json:"list_id"`
}

type AddLabelAction struct {
	Type    string `json:"type"` // add_label
	LabelID string `json:"label_id"`
}

type AddCommentAction struct {
	Type string `json:"type"` // add_comment
	Text string `json:"text"`
}

type AssignMemberAction struct {
	Type   string `json:"type"` // assign_member
	UserID string `json:"user_id"`
}

type SetDueDateAction struct {
	Type    string `json:"type"`     // set_due_date
	DueDate string `json:"due_date"` // ISO date or relative like "+7d"
}

type ArchiveCardAction struct {
	Type string `json:"type"` // archive_card
}

type SendWebhookAction struct {
	Type    string                 `json:"type"` // send_webhook
	URL     string                 `json:"url"`
	Payload map[string]interface{} `json:"payload"`
}
