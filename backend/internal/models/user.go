package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	FullName     string    `json:"full_name" gorm:"not null"`
	Bio          string    `json:"bio"`
	AvatarURL    string    `json:"avatar_url"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Notification preferences
	NotifyCardAssigned bool `json:"notify_card_assigned" gorm:"default:true"`
	NotifyDueDate      bool `json:"notify_due_date" gorm:"default:true"`
	NotifyComment      bool `json:"notify_comment" gorm:"default:true"`
	NotifyMention      bool `json:"notify_mention" gorm:"default:true"`

	// Language & Region
	Language   string `json:"language" gorm:"default:'en'"`
	Timezone   string `json:"timezone" gorm:"default:'UTC'"`
	DateFormat string `json:"date_format" gorm:"default:'DD/MM/YYYY'"`

	// Relations
	OwnedWorkspaces []Workspace       `json:"owned_workspaces,omitempty" gorm:"foreignKey:OwnerID"`
	Memberships     []WorkspaceMember `json:"memberships,omitempty" gorm:"foreignKey:UserID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Bio       string    `json:"bio"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`

	// Notification preferences
	NotifyCardAssigned bool `json:"notify_card_assigned"`
	NotifyDueDate      bool `json:"notify_due_date"`
	NotifyComment      bool `json:"notify_comment"`
	NotifyMention      bool `json:"notify_mention"`

	// Language & Region
	Language   string `json:"language"`
	Timezone   string `json:"timezone"`
	DateFormat string `json:"date_format"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:                 u.ID,
		Email:              u.Email,
		FullName:           u.FullName,
		Bio:                u.Bio,
		AvatarURL:          u.AvatarURL,
		CreatedAt:          u.CreatedAt,
		NotifyCardAssigned: u.NotifyCardAssigned,
		NotifyDueDate:      u.NotifyDueDate,
		NotifyComment:      u.NotifyComment,
		NotifyMention:      u.NotifyMention,
		Language:           u.Language,
		Timezone:           u.Timezone,
		DateFormat:         u.DateFormat,
	}
}
