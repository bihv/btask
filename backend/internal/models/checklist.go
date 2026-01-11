package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Checklist struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CardID    uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	Title     string    `json:"title" gorm:"not null"`
	Position  int       `json:"position" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Card  Card            `json:"card,omitempty" gorm:"foreignKey:CardID"`
	Items []ChecklistItem `json:"items,omitempty" gorm:"foreignKey:ChecklistID"`
}

func (c *Checklist) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type ChecklistItem struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	ChecklistID uuid.UUID `json:"checklist_id" gorm:"type:uuid;not null"`
	Content     string    `json:"content" gorm:"not null"`
	IsCompleted bool      `json:"is_completed" gorm:"default:false"`
	Position    int       `json:"position" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Checklist Checklist `json:"checklist,omitempty" gorm:"foreignKey:ChecklistID"`
}

func (ci *ChecklistItem) BeforeCreate(tx *gorm.DB) error {
	if ci.ID == uuid.Nil {
		ci.ID = uuid.New()
	}
	return nil
}

// Request structs
type CreateChecklistRequest struct {
	Title    string `json:"title" validate:"required,min=1,max=200"`
	Position *int   `json:"position"`
}

type UpdateChecklistRequest struct {
	Title    string `json:"title" validate:"omitempty,min=1,max=200"`
	Position *int   `json:"position"`
}

type CreateChecklistItemRequest struct {
	Content  string `json:"content" validate:"required,min=1,max=500"`
	Position *int   `json:"position"`
}

type UpdateChecklistItemRequest struct {
	Content     string `json:"content" validate:"omitempty,min=1,max=500"`
	IsCompleted *bool  `json:"is_completed"`
	Position    *int   `json:"position"`
}
