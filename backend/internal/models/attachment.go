package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Attachment struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CardID     uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	FileName   string    `json:"file_name" gorm:"not null"`
	FileURL    string    `json:"file_url" gorm:"not null"`
	FileType   string    `json:"file_type"`
	FileSize   int64     `json:"file_size"`
	UploadedBy uuid.UUID `json:"uploaded_by" gorm:"type:uuid"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relations
	Card     Card `json:"card,omitempty" gorm:"foreignKey:CardID"`
	Uploader User `json:"uploader,omitempty" gorm:"foreignKey:UploadedBy"`
}

func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type CreateAttachmentRequest struct {
	FileName string `json:"file_name" validate:"required"`
	FileURL  string `json:"file_url" validate:"required"`
	FileType string `json:"file_type"`
	FileSize int64  `json:"file_size"`
}
