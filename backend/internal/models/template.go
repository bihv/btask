package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Template represents a board template
type Template struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Title           string    `json:"title" gorm:"not null"`
	Author          string    `json:"author"`
	Description     string    `json:"description"`
	FullDescription string    `json:"full_description"`
	Category        string    `json:"category"`
	CoverColor      string    `json:"cover_color"`
	CoverURL        string    `json:"cover_url"`
	Copies          int       `json:"copies" gorm:"default:0"`
	Views           int       `json:"views" gorm:"default:0"`
	IsFeatured      bool      `json:"is_featured" gorm:"default:false"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	CreatedBy       uuid.UUID `json:"created_by" gorm:"type:uuid"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	Creator *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Lists   []TemplateList `json:"lists,omitempty" gorm:"foreignKey:TemplateID"`
}

func (t *Template) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// TemplateList represents a list in a template
type TemplateList struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	TemplateID uuid.UUID `json:"template_id" gorm:"type:uuid;not null"`
	Title      string    `json:"title" gorm:"not null"`
	Color      string    `json:"color"`
	Position   int       `json:"position" gorm:"default:0"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	Cards []TemplateCard `json:"cards,omitempty" gorm:"foreignKey:TemplateListID"`
}

func (tl *TemplateList) BeforeCreate(tx *gorm.DB) error {
	if tl.ID == uuid.Nil {
		tl.ID = uuid.New()
	}
	return nil
}

// TemplateCard represents a card in a template list
type TemplateCard struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	TemplateListID uuid.UUID  `json:"template_list_id" gorm:"type:uuid;not null"`
	Title          string     `json:"title" gorm:"not null"`
	Description    string     `json:"description"` // BlockNote JSON
	CoverURL       string     `json:"cover_url"`
	DueDate        *time.Time `json:"due_date"`
	Position       int        `json:"position" gorm:"default:0"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (tc *TemplateCard) BeforeCreate(tx *gorm.DB) error {
	if tc.ID == uuid.Nil {
		tc.ID = uuid.New()
	}
	return nil
}

// Request/Response types
type CreateTemplateRequest struct {
	Title           string                    `json:"title" validate:"required,min=1,max=100"`
	Author          string                    `json:"author" validate:"max=100"`
	Description     string                    `json:"description" validate:"max=500"`
	FullDescription string                    `json:"full_description"`
	Category        string                    `json:"category" validate:"max=50"`
	CoverColor      string                    `json:"cover_color"`
	CoverURL        string                    `json:"cover_url"`
	IsFeatured      bool                      `json:"is_featured"`
	Lists           []CreateTemplateListInput `json:"lists"`
}

type CreateTemplateListInput struct {
	Title    string                    `json:"title" validate:"required"`
	Color    string                    `json:"color"`
	Position int                       `json:"position"`
	Cards    []CreateTemplateCardInput `json:"cards"`
}

type CreateTemplateCardInput struct {
	Title       string     `json:"title" validate:"required"`
	Description string     `json:"description"`
	CoverURL    string     `json:"cover_url"`
	DueDate     *time.Time `json:"due_date"`
	Position    int        `json:"position"`
}

type UpdateTemplateRequest struct {
	Title           *string `json:"title" validate:"omitempty,min=1,max=100"`
	Author          *string `json:"author" validate:"omitempty,max=100"`
	Description     *string `json:"description" validate:"omitempty,max=500"`
	FullDescription *string `json:"full_description"`
	Category        *string `json:"category" validate:"omitempty,max=50"`
	CoverColor      *string `json:"cover_color"`
	CoverURL        *string `json:"cover_url"`
	IsFeatured      *bool   `json:"is_featured"`
	IsActive        *bool   `json:"is_active"`
}

type TemplateListParams struct {
	Page       int    `query:"page"`
	Limit      int    `query:"limit"`
	Search     string `query:"search"`
	Category   string `query:"category"`
	IsFeatured *bool  `query:"is_featured"`
}
