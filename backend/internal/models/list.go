package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type List struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	BoardID    uuid.UUID `json:"board_id" gorm:"type:uuid;not null"`
	Title      string    `json:"title" gorm:"not null"`
	Position   int       `json:"position" gorm:"default:0"`
	Color      string    `json:"color" gorm:"default:null"`
	IsArchived bool      `json:"is_archived" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relations
	Board Board  `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Cards []Card `json:"cards,omitempty" gorm:"foreignKey:ListID"`
}

func (l *List) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

type CreateListRequest struct {
	Title    string `json:"title" validate:"required,min=1,max=100"`
	Position *int   `json:"position"`
}

type UpdateListRequest struct {
	Title    string `json:"title" validate:"omitempty,min=1,max=100"`
	Position *int   `json:"position"`
	Color    string `json:"color"`
}

type MoveListRequest struct {
	Position int `json:"position" validate:"required,min=0"`
}

type CopyListRequest struct {
	Title string `json:"title"`
}

type MoveAllCardsRequest struct {
	TargetListID string `json:"target_list_id" validate:"required"`
}

type SortCardsRequest struct {
	SortBy string `json:"sort_by" validate:"required,oneof=date_newest date_oldest alphabetical"`
}
