package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AttachmentSource represents where the attachment was uploaded from
type AttachmentSource string

const (
	AttachmentSourceUpload AttachmentSource = "upload" // Uploaded via Attachment section
	AttachmentSourceEditor AttachmentSource = "editor" // Uploaded via BlockNote editor
)

type Attachment struct {
	ID         uuid.UUID        `json:"id" gorm:"type:uuid;primary_key"`
	CardID     uuid.UUID        `json:"card_id" gorm:"type:uuid;not null"`
	FileName   string           `json:"file_name" gorm:"not null"`
	FileURL    string           `json:"file_url" gorm:"not null"`
	FileType   string           `json:"file_type"`
	FileSize   int64            `json:"file_size"`
	UploadedBy uuid.UUID        `json:"uploaded_by" gorm:"type:uuid"`
	Source     AttachmentSource `json:"source" gorm:"type:varchar(20);default:'upload'"` // 'upload' or 'editor'
	IsOrphan   bool             `json:"is_orphan" gorm:"default:false"`                  // True if file is no longer referenced in editor
	OrphanedAt *time.Time       `json:"orphaned_at,omitempty"`                           // When the file became orphan
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`

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
	FileName string           `json:"file_name" validate:"required"`
	FileURL  string           `json:"file_url" validate:"required"`
	FileType string           `json:"file_type"`
	FileSize int64            `json:"file_size"`
	Source   AttachmentSource `json:"source"` // Optional: 'upload' or 'editor', defaults to 'upload'
}
