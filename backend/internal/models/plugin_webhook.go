package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// PluginWebhook represents webhook subscriptions for plugins
type PluginWebhook struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key"`
	PluginID        uuid.UUID      `json:"plugin_id" gorm:"type:uuid;not null;index"`
	InstallationID  uuid.UUID      `json:"installation_id" gorm:"type:uuid;not null;index"`
	CallbackURL     string         `json:"callback_url" gorm:"not null"`
	Secret          string         `json:"-"`
	Events          pq.StringArray `json:"events" gorm:"type:text[]"`
	BoardID         *uuid.UUID     `json:"board_id" gorm:"type:uuid"`
	IsActive        bool           `json:"is_active" gorm:"default:true"`
	FailureCount    int            `json:"failure_count" gorm:"default:0"`
	LastTriggeredAt *time.Time     `json:"last_triggered_at"`
	LastSuccessAt   *time.Time     `json:"last_success_at"`
	LastError       string         `json:"last_error"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`

	// Relations
	Plugin       Plugin             `json:"-" gorm:"foreignKey:PluginID"`
	Installation PluginInstallation `json:"-" gorm:"foreignKey:InstallationID"`
	Board        *Board             `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Deliveries   []WebhookDelivery  `json:"deliveries,omitempty" gorm:"foreignKey:WebhookID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (pw *PluginWebhook) BeforeCreate(tx *gorm.DB) error {
	if pw.ID == uuid.Nil {
		pw.ID = uuid.New()
	}
	return nil
}

// WebhookDelivery represents a single webhook delivery attempt
type WebhookDelivery struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	WebhookID      uuid.UUID  `json:"webhook_id" gorm:"type:uuid;not null;index"`
	EventType      string     `json:"event_type" gorm:"not null"`
	Payload        JSONMap    `json:"payload" gorm:"type:jsonb;not null"`
	ResponseStatus *int       `json:"response_status"`
	ResponseBody   string     `json:"response_body"`
	ResponseTimeMs *int       `json:"response_time_ms"`
	Status         string     `json:"status" gorm:"default:'pending';index"` // pending, success, failed, retrying
	AttemptCount   int        `json:"attempt_count" gorm:"default:0"`
	NextRetryAt    *time.Time `json:"next_retry_at" gorm:"index"`
	CreatedAt      time.Time  `json:"created_at"`

	// Relations
	Webhook PluginWebhook `json:"-" gorm:"foreignKey:WebhookID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (wd *WebhookDelivery) BeforeCreate(tx *gorm.DB) error {
	if wd.ID == uuid.Nil {
		wd.ID = uuid.New()
	}
	return nil
}

// Request/Response DTOs
type CreateWebhookRequest struct {
	CallbackURL string   `json:"callback_url" validate:"required,url"`
	Secret      string   `json:"secret" validate:"required,min=16"`
	Events      []string `json:"events" validate:"required,min=1"`
	BoardID     *string  `json:"board_id"`
}

type UpdateWebhookRequest struct {
	CallbackURL string   `json:"callback_url" validate:"omitempty,url"`
	Secret      string   `json:"secret" validate:"omitempty,min=16"`
	Events      []string `json:"events" validate:"omitempty,min=1"`
	IsActive    *bool    `json:"is_active"`
}

type WebhookDeliveryResponse struct {
	ID             uuid.UUID  `json:"id"`
	EventType      string     `json:"event_type"`
	Status         string     `json:"status"`
	ResponseStatus *int       `json:"response_status"`
	ResponseTimeMs *int       `json:"response_time_ms"`
	AttemptCount   int        `json:"attempt_count"`
	CreatedAt      time.Time  `json:"created_at"`
	NextRetryAt    *time.Time `json:"next_retry_at"`
}
