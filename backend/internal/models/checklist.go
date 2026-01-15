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
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	ChecklistID uuid.UUID  `json:"checklist_id" gorm:"type:uuid;not null"`
	Content     string     `json:"content" gorm:"not null"`
	IsCompleted bool       `json:"is_completed" gorm:"default:false"`
	Position    int        `json:"position" gorm:"default:0"`
	DueDate     *time.Time `json:"due_date"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relations
	Checklist Checklist               `json:"checklist,omitempty" gorm:"foreignKey:ChecklistID"`
	Assignees []ChecklistItemAssignee `json:"assignees,omitempty" gorm:"foreignKey:ChecklistItemID"`
}

func (ci *ChecklistItem) BeforeCreate(tx *gorm.DB) error {
	if ci.ID == uuid.Nil {
		ci.ID = uuid.New()
	}
	return nil
}

// ChecklistItemAssignee represents a many-to-many relationship between checklist items and users
type ChecklistItemAssignee struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	ChecklistItemID uuid.UUID `json:"checklist_item_id" gorm:"type:uuid;not null"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`

	// Relations
	ChecklistItem ChecklistItem `json:"-" gorm:"foreignKey:ChecklistItemID"`
	User          User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (cia *ChecklistItemAssignee) BeforeCreate(tx *gorm.DB) error {
	if cia.ID == uuid.Nil {
		cia.ID = uuid.New()
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
	Content     string      `json:"content" validate:"required,min=1,max=500"`
	Position    *int        `json:"position"`
	AssigneeIDs []uuid.UUID `json:"assignee_ids"`
	DueDate     *time.Time  `json:"due_date"`
}

type UpdateChecklistItemRequest struct {
	Content      string      `json:"content" validate:"omitempty,min=1,max=500"`
	IsCompleted  *bool       `json:"is_completed"`
	Position     *int        `json:"position"`
	AssigneeIDs  []uuid.UUID `json:"assignee_ids"`
	DueDate      *time.Time  `json:"due_date"`
	ClearDueDate bool        `json:"clear_due_date"` // Set to true to explicitly clear the due date
}

// ConvertToCardRequest for converting a checklist item to a card
type ConvertToCardRequest struct {
	ListID uuid.UUID `json:"list_id" validate:"required"`
}
