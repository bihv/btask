package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// AllowedFileTypesConfig stores file type restrictions
type AllowedFileTypesConfig struct {
	AllowedPrefixes []string `json:"allowed_prefixes"` // e.g., ["image/", "video/", "audio/"]
	AllowedTypes    []string `json:"allowed_types"`    // e.g., ["application/pdf", "text/plain"]
	BlockedTypes    []string `json:"blocked_types"`    // e.g., ["image/svg+xml"]
}

// Value implements driver.Valuer for database storage
func (c AllowedFileTypesConfig) Value() (driver.Value, error) {
	return json.Marshal(c)
}

// Scan implements sql.Scanner for database retrieval
func (c *AllowedFileTypesConfig) Scan(value interface{}) error {
	if value == nil {
		*c = AllowedFileTypesConfig{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan AllowedFileTypesConfig")
	}
	return json.Unmarshal(bytes, c)
}

// SystemSettings stores global application settings
// Uses a single row approach (singleton pattern)
type SystemSettings struct {
	ID                     uint                   `json:"id" gorm:"primaryKey"`
	OrphanCleanupDays      int                    `json:"orphan_cleanup_days" gorm:"default:7"`       // Days to keep orphan files before deletion
	OrphanCleanupEnabled   bool                   `json:"orphan_cleanup_enabled" gorm:"default:true"` // Enable/disable automatic cleanup
	LastOrphanCleanupAt    *time.Time             `json:"last_orphan_cleanup_at"`                     // Last time cleanup job ran
	MaxUploadSizeMB        int                    `json:"max_upload_size_mb" gorm:"default:50"`       // Max file upload size in MB
	AllowedFileTypes       AllowedFileTypesConfig `json:"allowed_file_types" gorm:"type:jsonb"`       // File type restrictions
	CreatedAt              time.Time              `json:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at"`
}

// TableName specifies the table name for GORM
func (SystemSettings) TableName() string {
	return "system_settings"
}

// UpdateSystemSettingsRequest represents the request to update system settings
type UpdateSystemSettingsRequest struct {
	OrphanCleanupDays    *int                    `json:"orphan_cleanup_days"`
	OrphanCleanupEnabled *bool                   `json:"orphan_cleanup_enabled"`
	MaxUploadSizeMB      *int                    `json:"max_upload_size_mb"`
	AllowedFileTypes     *AllowedFileTypesConfig `json:"allowed_file_types"`
}
