package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListWatcher struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ListID    uuid.UUID `json:"list_id" gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	CreatedAt time.Time `json:"created_at"`
}

func (lw *ListWatcher) BeforeCreate(tx *gorm.DB) error {
	if lw.ID == uuid.Nil {
		lw.ID = uuid.New()
	}
	return nil
}

// Unique constraint on list_id + user_id
func (ListWatcher) TableName() string {
	return "list_watchers"
}
