package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Label struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	BoardID uuid.UUID `json:"board_id" gorm:"type:uuid;not null"`
	Name    string    `json:"name"`
	Color   string    `json:"color" gorm:"not null"`

	// Relations
	Board Board       `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Cards []CardLabel `json:"cards,omitempty" gorm:"foreignKey:LabelID"`
}

func (l *Label) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

type CardLabel struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CardID  uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	LabelID uuid.UUID `json:"label_id" gorm:"type:uuid;not null"`

	// Relations
	Card  Card  `json:"card,omitempty" gorm:"foreignKey:CardID"`
	Label Label `json:"label,omitempty" gorm:"foreignKey:LabelID"`
}

func (cl *CardLabel) BeforeCreate(tx *gorm.DB) error {
	if cl.ID == uuid.Nil {
		cl.ID = uuid.New()
	}
	return nil
}

type CreateLabelRequest struct {
	Name  string `json:"name" validate:"max=50"`
	Color string `json:"color" validate:"required"`
}

type UpdateLabelRequest struct {
	Name  string `json:"name" validate:"max=50"`
	Color string `json:"color"`
}

type Comment struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CardID    uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Content   string    `json:"content" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Card Card `json:"card,omitempty" gorm:"foreignKey:CardID"`
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type CreateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}
