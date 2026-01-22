package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Card struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	ListID      uuid.UUID  `json:"list_id" gorm:"type:uuid;not null"`
	Title       string     `json:"title" gorm:"not null"`
	Description string     `json:"description"`
	CoverImage  string     `json:"cover_image"`
	CoverImageY int        `json:"cover_image_y" gorm:"default:50"` // percentage 0-100
	Position    int        `json:"position" gorm:"default:0"`
	DueDate     *time.Time `json:"due_date"`
	IsCompleted bool       `json:"is_completed" gorm:"default:false"`
	IsArchived  bool       `json:"is_archived" gorm:"default:false"`
	CreatedBy   uuid.UUID  `json:"created_by" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relations
	List              List                   `json:"list,omitempty" gorm:"foreignKey:ListID"`
	Creator           User                   `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Labels            []CardLabel            `json:"labels,omitempty" gorm:"foreignKey:CardID"`
	Members           []CardMember           `json:"members,omitempty" gorm:"foreignKey:CardID"`
	Comments          []Comment              `json:"comments,omitempty" gorm:"foreignKey:CardID"`
	CustomFieldValues []CardCustomFieldValue `json:"custom_field_values,omitempty" gorm:"foreignKey:CardID"`
}

func (c *Card) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type CardMember struct {
	ID     uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CardID uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	UserID uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`

	// Relations
	Card Card `json:"card,omitempty" gorm:"foreignKey:CardID"`
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (cm *CardMember) BeforeCreate(tx *gorm.DB) error {
	if cm.ID == uuid.Nil {
		cm.ID = uuid.New()
	}
	return nil
}

type CreateCardRequest struct {
	Title       string     `json:"title" validate:"required,min=1,max=200"`
	Description string     `json:"description"`
	Position    *int       `json:"position"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateCardRequest struct {
	Title       string     `json:"title" validate:"omitempty,min=1,max=200"`
	Description string     `json:"description"`
	CoverImage  *string    `json:"cover_image"`
	CoverImageY *int       `json:"cover_image_y"`
	Position    *int       `json:"position"`
	DueDate     *time.Time `json:"due_date"`
	IsCompleted *bool      `json:"is_completed"`
	IsArchived  *bool      `json:"is_archived"`
}

type MoveCardRequest struct {
	ListID   uuid.UUID `json:"list_id" validate:"required"`
	Position int       `json:"position" validate:"min=0"`
}

// CardFilterRequest contains filter parameters for fetching cards
type CardFilterRequest struct {
	Keyword         string   `json:"keyword" query:"keyword"`
	IsComplete      *bool    `json:"is_complete" query:"is_complete"`
	IsIncomplete    *bool    `json:"is_incomplete" query:"is_incomplete"`
	NoDueDate       bool     `json:"no_due_date" query:"no_due_date"`
	Overdue         bool     `json:"overdue" query:"overdue"`
	DueNextDay      bool     `json:"due_next_day" query:"due_next_day"`
	DueNextWeek     bool     `json:"due_next_week" query:"due_next_week"`
	DueNextMonth    bool     `json:"due_next_month" query:"due_next_month"`
	BoardIDs        []string `json:"board_ids" query:"board_ids"`
	ActiveLastDay   bool     `json:"active_last_day" query:"active_last_day"`
	ActiveLastWeek  bool     `json:"active_last_week" query:"active_last_week"`
	ActiveLastMonth bool     `json:"active_last_month" query:"active_last_month"`
	ActiveLastYear  bool     `json:"active_last_year" query:"active_last_year"`
}
