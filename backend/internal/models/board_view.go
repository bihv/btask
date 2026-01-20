package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BoardView tracks when users view boards for "recently viewed" functionality
type BoardView struct {
	ID       uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	BoardID  uuid.UUID `json:"board_id" gorm:"type:uuid;not null;index"`
	UserID   uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	ViewedAt time.Time `json:"viewed_at" gorm:"not null"`

	// Relations
	Board Board `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	User  User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (bv *BoardView) BeforeCreate(tx *gorm.DB) error {
	if bv.ID == uuid.Nil {
		bv.ID = uuid.New()
	}
	if bv.ViewedAt.IsZero() {
		bv.ViewedAt = time.Now()
	}
	return nil
}

// TableName specifies the table name
func (BoardView) TableName() string {
	return "board_views"
}
