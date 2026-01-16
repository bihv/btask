package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Board struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	WorkspaceID     uuid.UUID `json:"workspace_id" gorm:"type:uuid;not null"`
	Title           string    `json:"title" gorm:"not null"`
	Description     string    `json:"description"`
	BackgroundColor string    `json:"background_color" gorm:"default:'#0079bf'"`
	BackgroundImage string    `json:"background_image"`
	IsStarred       bool      `json:"is_starred" gorm:"default:false"`
	ShowCardCovers  bool      `json:"show_card_covers" gorm:"default:true"`
	Position        int       `json:"position" gorm:"default:0"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	Workspace    Workspace     `json:"workspace,omitempty" gorm:"foreignKey:WorkspaceID"`
	Lists        []List        `json:"lists,omitempty" gorm:"foreignKey:BoardID"`
	Labels       []Label       `json:"labels,omitempty" gorm:"foreignKey:BoardID"`
	CustomFields []CustomField `json:"custom_fields,omitempty" gorm:"foreignKey:BoardID"`
}

func (b *Board) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

type CreateBoardRequest struct {
	Title           string `json:"title" validate:"required,min=1,max=100"`
	Description     string `json:"description" validate:"max=500"`
	BackgroundColor string `json:"background_color"`
}

type UpdateBoardRequest struct {
	Title           string `json:"title" validate:"omitempty,min=1,max=100"`
	Description     string `json:"description" validate:"max=500"`
	BackgroundColor string `json:"background_color"`
	BackgroundImage string `json:"background_image"`
	IsStarred       *bool  `json:"is_starred"`
	ShowCardCovers  *bool  `json:"show_card_covers"`
	Position        *int   `json:"position"`
}

type CopyBoardRequest struct {
	Title       string `json:"title" validate:"required,min=1,max=100"`
	WorkspaceID string `json:"workspace_id"` // Optional, defaults to same workspace
}
