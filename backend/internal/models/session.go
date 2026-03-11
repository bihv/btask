package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserSession struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	TokenHash     string    `json:"-" gorm:"uniqueIndex;not null"`
	DeviceType    string    `json:"device_type" gorm:"type:varchar(50)"`
	DeviceName    string    `json:"device_name" gorm:"type:varchar(255)"`
	IPAddress     string    `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent     string    `json:"user_agent" gorm:"type:text"`
	Location      string    `json:"location" gorm:"type:varchar(255)"`
	IsCurrent     bool      `json:"is_current" gorm:"default:false"`
	CreatedAt     time.Time `json:"created_at"`
	ExpiresAt     time.Time `json:"expires_at"`
	LastActiveAt  time.Time `json:"last_active_at"`
}

func (s *UserSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	if s.LastActiveAt.IsZero() {
		s.LastActiveAt = time.Now()
	}
	return nil
}

type SessionResponse struct {
	ID           uuid.UUID `json:"id"`
	DeviceType   string    `json:"device_type"`
	DeviceName   string    `json:"device_name"`
	IPAddress    string    `json:"ip_address"`
	Location     string    `json:"location"`
	IsCurrent    bool      `json:"is_current"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	LastActiveAt time.Time `json:"last_active_at"`
}

func (s *UserSession) ToResponse() SessionResponse {
	return SessionResponse{
		ID:           s.ID,
		DeviceType:   s.DeviceType,
		DeviceName:   s.DeviceName,
		IPAddress:    s.IPAddress,
		Location:     s.Location,
		IsCurrent:    s.IsCurrent,
		CreatedAt:    s.CreatedAt,
		ExpiresAt:    s.ExpiresAt,
		LastActiveAt: s.LastActiveAt,
	}
}
