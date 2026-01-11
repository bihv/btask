package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Notification struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	Type      string     `json:"type" gorm:"not null"` // card_created, card_updated, card_moved, etc.
	Title     string     `json:"title" gorm:"not null"`
	Message   string     `json:"message"`
	BoardID   uuid.UUID  `json:"board_id" gorm:"type:uuid"`
	ListID    *uuid.UUID `json:"list_id" gorm:"type:uuid"`
	CardID    *uuid.UUID `json:"card_id" gorm:"type:uuid"`
	IsRead    bool       `json:"is_read" gorm:"default:false"`
	CreatedAt time.Time  `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
