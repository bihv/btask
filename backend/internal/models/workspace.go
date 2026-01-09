package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Workspace struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	OwnerID     uuid.UUID `json:"owner_id" gorm:"type:uuid;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Owner   User              `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
	Members []WorkspaceMember `json:"members,omitempty" gorm:"foreignKey:WorkspaceID"`
	Boards  []Board           `json:"boards,omitempty" gorm:"foreignKey:WorkspaceID"`
}

func (w *Workspace) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

type WorkspaceMember struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	WorkspaceID uuid.UUID `json:"workspace_id" gorm:"type:uuid;not null"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Role        string    `json:"role" gorm:"default:'member'"` // owner, admin, member
	CreatedAt   time.Time `json:"created_at"`

	// Relations
	Workspace Workspace `json:"workspace,omitempty" gorm:"foreignKey:WorkspaceID"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (wm *WorkspaceMember) BeforeCreate(tx *gorm.DB) error {
	if wm.ID == uuid.Nil {
		wm.ID = uuid.New()
	}
	return nil
}

type CreateWorkspaceRequest struct {
	Name        string `json:"name" validate:"required,min=1,max=100"`
	Description string `json:"description" validate:"max=500"`
}

type UpdateWorkspaceRequest struct {
	Name        string `json:"name" validate:"omitempty,min=1,max=100"`
	Description string `json:"description" validate:"max=500"`
}
