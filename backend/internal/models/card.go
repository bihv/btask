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
	Position    int        `json:"position" gorm:"default:0"`
	DueDate     *time.Time `json:"due_date"`
	IsCompleted bool       `json:"is_completed" gorm:"default:false"`
	IsArchived  bool       `json:"is_archived" gorm:"default:false"`
	CreatedBy   uuid.UUID  `json:"created_by" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relations
	List     List         `json:"list,omitempty" gorm:"foreignKey:ListID"`
	Creator  User         `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Labels   []CardLabel  `json:"labels,omitempty" gorm:"foreignKey:CardID"`
	Members  []CardMember `json:"members,omitempty" gorm:"foreignKey:CardID"`
	Comments []Comment    `json:"comments,omitempty" gorm:"foreignKey:CardID"`
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
	CoverImage  string     `json:"cover_image"`
	Position    *int       `json:"position"`
	DueDate     *time.Time `json:"due_date"`
	IsCompleted *bool      `json:"is_completed"`
	IsArchived  *bool      `json:"is_archived"`
}

type MoveCardRequest struct {
	ListID   uuid.UUID `json:"list_id" validate:"required"`
	Position int       `json:"position" validate:"min=0"`
}
