package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CustomFieldType represents the type of custom field
type CustomFieldType string

const (
	CustomFieldTypeCheckbox CustomFieldType = "checkbox"
	CustomFieldTypeText     CustomFieldType = "text"
	CustomFieldTypeDropdown CustomFieldType = "dropdown"
	CustomFieldTypeNumber   CustomFieldType = "number"
	CustomFieldTypeDate     CustomFieldType = "date"
)

// CustomField defines a custom field at board level
type CustomField struct {
	ID         uuid.UUID       `json:"id" gorm:"type:uuid;primary_key"`
	BoardID    uuid.UUID       `json:"board_id" gorm:"type:uuid;not null"`
	Name       string          `json:"name" gorm:"not null"`
	Type       CustomFieldType `json:"type" gorm:"not null"`
	Position   int             `json:"position" gorm:"default:0"`
	ShowOnCard bool            `json:"show_on_card" gorm:"default:true"`
	IsDefault  bool            `json:"is_default" gorm:"default:false"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`

	// Relations
	Board   Board               `json:"-" gorm:"foreignKey:BoardID"`
	Options []CustomFieldOption `json:"options,omitempty" gorm:"foreignKey:CustomFieldID;constraint:OnDelete:CASCADE"`
}

func (cf *CustomField) BeforeCreate(tx *gorm.DB) error {
	if cf.ID == uuid.Nil {
		cf.ID = uuid.New()
	}
	return nil
}

// CustomFieldOption represents an option for dropdown type fields
type CustomFieldOption struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	CustomFieldID uuid.UUID `json:"custom_field_id" gorm:"type:uuid;not null"`
	Value         string    `json:"value" gorm:"not null"`
	Color         string    `json:"color"`
	Position      int       `json:"position" gorm:"default:0"`

	// Relations
	CustomField CustomField `json:"-" gorm:"foreignKey:CustomFieldID"`
}

func (cfo *CustomFieldOption) BeforeCreate(tx *gorm.DB) error {
	if cfo.ID == uuid.Nil {
		cfo.ID = uuid.New()
	}
	return nil
}

// CardCustomFieldValue stores the value of a custom field for a card
type CardCustomFieldValue struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	CardID        uuid.UUID  `json:"card_id" gorm:"type:uuid;not null"`
	CustomFieldID uuid.UUID  `json:"custom_field_id" gorm:"type:uuid;not null"`
	Value         string     `json:"value"`
	OptionID      *uuid.UUID `json:"option_id" gorm:"type:uuid"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Relations
	Card        Card               `json:"-" gorm:"foreignKey:CardID"`
	CustomField CustomField        `json:"custom_field,omitempty" gorm:"foreignKey:CustomFieldID"`
	Option      *CustomFieldOption `json:"option,omitempty" gorm:"foreignKey:OptionID"`
}

func (ccfv *CardCustomFieldValue) BeforeCreate(tx *gorm.DB) error {
	if ccfv.ID == uuid.Nil {
		ccfv.ID = uuid.New()
	}
	return nil
}

// Request/Response structs

type CreateCustomFieldRequest struct {
	Name       string   `json:"name" validate:"required,min=1,max=100"`
	Type       string   `json:"type" validate:"required,oneof=checkbox text dropdown number date"`
	ShowOnCard bool     `json:"show_on_card"`
	Options    []string `json:"options"`
}

type UpdateCustomFieldRequest struct {
	Name       string `json:"name" validate:"omitempty,min=1,max=100"`
	ShowOnCard *bool  `json:"show_on_card"`
	Position   *int   `json:"position"`
}

type AddCustomFieldOptionRequest struct {
	Value string `json:"value" validate:"required,min=1,max=100"`
	Color string `json:"color"`
}

type SetCardCustomFieldValueRequest struct {
	Value    string `json:"value"`
	OptionID string `json:"option_id"`
}

type AddDefaultFieldRequest struct {
	FieldName string `json:"field_name" validate:"required"`
}

// Default field definitions
var DefaultCustomFields = map[string]struct {
	Name    string
	Type    CustomFieldType
	Options []struct {
		Value string
		Color string
	}
}{
	"priority": {
		Name: "Priority",
		Type: CustomFieldTypeDropdown,
		Options: []struct {
			Value string
			Color string
		}{
			{Value: "Critical", Color: "#eb5a46"},
			{Value: "High", Color: "#ff9f1a"},
			{Value: "Medium", Color: "#f2d600"},
			{Value: "Low", Color: "#61bd4f"},
		},
	},
	"status": {
		Name: "Status",
		Type: CustomFieldTypeDropdown,
		Options: []struct {
			Value string
			Color string
		}{
			{Value: "Not Started", Color: "#b3bac5"},
			{Value: "In Progress", Color: "#0079bf"},
			{Value: "On Hold", Color: "#ff9f1a"},
			{Value: "Completed", Color: "#61bd4f"},
		},
	},
	"risk": {
		Name: "Risk",
		Type: CustomFieldTypeDropdown,
		Options: []struct {
			Value string
			Color string
		}{
			{Value: "High", Color: "#eb5a46"},
			{Value: "Medium", Color: "#ff9f1a"},
			{Value: "Low", Color: "#61bd4f"},
		},
	},
	"effort": {
		Name: "Effort",
		Type: CustomFieldTypeDropdown,
		Options: []struct {
			Value string
			Color string
		}{
			{Value: "XL", Color: "#eb5a46"},
			{Value: "L", Color: "#ff9f1a"},
			{Value: "M", Color: "#f2d600"},
			{Value: "S", Color: "#61bd4f"},
			{Value: "XS", Color: "#c377e0"},
		},
	},
}
