package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BoardWatcher struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	BoardID   uuid.UUID `json:"board_id" gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	CreatedAt time.Time `json:"created_at"`
}

func (bw *BoardWatcher) BeforeCreate(tx *gorm.DB) error {
	if bw.ID == uuid.Nil {
		bw.ID = uuid.New()
	}
	return nil
}

// Unique constraint on board_id + user_id
func (BoardWatcher) TableName() string {
	return "board_watchers"
}
