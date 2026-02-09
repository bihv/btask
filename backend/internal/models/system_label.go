package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SystemLabel represents a translatable text label for the application
type SystemLabel struct {
	ID           uuid.UUID           `json:"id" gorm:"type:uuid;primary_key"`
	Key          string              `json:"key" gorm:"uniqueIndex;not null;size:100"`
	Category     string              `json:"category" gorm:"size:50;index"`
	DefaultValue string              `json:"default_value" gorm:"not null"`
	Description  string              `json:"description"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
	Translations []SystemTranslation `json:"translations,omitempty" gorm:"foreignKey:LabelID;constraint:OnDelete:CASCADE"`
}

func (l *SystemLabel) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// SystemTranslation represents a translation for a system label
type SystemTranslation struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	LabelID   uuid.UUID `json:"label_id" gorm:"type:uuid;not null;index"`
	Language  string    `json:"language" gorm:"size:10;not null"`
	Value     string    `json:"value" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *SystemTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// UpdateSystemLabelRequest is the request for updating a label
type UpdateSystemLabelRequest struct {
	Key          string `json:"key" validate:"max=100"`
	Category     string `json:"category" validate:"max=50"`
	DefaultValue string `json:"default_value"`
	Description  string `json:"description"`
}

// CreateTranslationRequest is the request for creating a translation
type CreateTranslationRequest struct {
	LabelID  uuid.UUID `json:"label_id" validate:"required"`
	Language string    `json:"language" validate:"required,max=10"`
	Value    string    `json:"value" validate:"required"`
}

// UpdateTranslationRequest is the request for updating a translation
type UpdateTranslationRequest struct {
	Value string `json:"value" validate:"required"`
}

// LabelSeed represents the structure for export/import and seeding
type LabelSeed struct {
	Key          string            `json:"key"`
	Category     string            `json:"category"`
	DefaultValue string            `json:"default_value"`
	Description  string            `json:"description"`
	Translations map[string]string `json:"translations"`
}
