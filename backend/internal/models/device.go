package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RememberedDevice struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID            uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	DeviceFingerprint string    `json:"device_fingerprint" gorm:"type:varchar(255);not null"`
	DeviceName        string    `json:"device_name" gorm:"type:varchar(255)"`
	IPAddress         string    `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent         string    `json:"user_agent" gorm:"type:varchar(500)"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	ExpiresAt         time.Time `json:"expires_at"`
	LastUsedAt        time.Time `json:"last_used_at" gorm:"autoUpdateTime"`
}

func (RememberedDevice) TableName() string {
	return "remembered_devices"
}

func (d *RememberedDevice) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.Now()
	}
	if d.LastUsedAt.IsZero() {
		d.LastUsedAt = time.Now()
	}
	return nil
}

func (d *RememberedDevice) IsExpired() bool {
	return time.Now().After(d.ExpiresAt)
}

type DeviceResponse struct {
	ID                uuid.UUID `json:"id"`
	DeviceName        string    `json:"device_name"`
	IPAddress         string    `json:"ip_address"`
	CreatedAt         time.Time `json:"created_at"`
	ExpiresAt         time.Time `json:"expires_at"`
	LastUsedAt        time.Time `json:"last_used_at"`
}

func (d *RememberedDevice) ToResponse() DeviceResponse {
	return DeviceResponse{
		ID:         d.ID,
		DeviceName: d.DeviceName,
		IPAddress:  d.IPAddress,
		CreatedAt:  d.CreatedAt,
		ExpiresAt:  d.ExpiresAt,
		LastUsedAt: d.LastUsedAt,
	}
}
