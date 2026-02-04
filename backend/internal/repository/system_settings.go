package repository

import (
	"strings"

	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
)

type SystemSettingsRepository struct{}

func NewSystemSettingsRepository() *SystemSettingsRepository {
	return &SystemSettingsRepository{}
}

// Get returns the singleton system settings
func (r *SystemSettingsRepository) Get() (*models.SystemSettings, error) {
	var settings models.SystemSettings
	err := database.DB.First(&settings).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

// Update updates the system settings
func (r *SystemSettingsRepository) Update(settings *models.SystemSettings) error {
	return database.DB.Save(settings).Error
}

// GetOrphanCleanupDays returns the number of days to keep orphan files
func (r *SystemSettingsRepository) GetOrphanCleanupDays() (int, error) {
	settings, err := r.Get()
	if err != nil {
		return 7, nil // Default to 7 days if error
	}
	return settings.OrphanCleanupDays, nil
}

// GetMaxUploadSize returns the max upload file size in MB
func (r *SystemSettingsRepository) GetMaxUploadSize() int {
	settings, err := r.Get()
	if err != nil {
		return 50 // Default to 50 MB if error
	}
	return settings.MaxUploadSizeMB
}

// IsContentTypeAllowed checks if a content type is allowed based on settings
func (r *SystemSettingsRepository) IsContentTypeAllowed(contentType string) bool {
	settings, err := r.Get()
	if err != nil {
		// Default: allow common types if can't fetch settings
		return isDefaultAllowed(contentType)
	}

	config := settings.AllowedFileTypes

	// Check blocked types first (highest priority)
	for _, blocked := range config.BlockedTypes {
		if contentType == blocked {
			return false
		}
	}

	// Check prefix match (e.g., "image/" matches "image/jpeg")
	for _, prefix := range config.AllowedPrefixes {
		if strings.HasPrefix(contentType, prefix) {
			return true
		}
	}

	// Check exact match
	for _, allowed := range config.AllowedTypes {
		if contentType == allowed {
			return true
		}
	}

	return false
}

// isDefaultAllowed returns true for common file types (fallback when settings unavailable)
func isDefaultAllowed(contentType string) bool {
	defaultPrefixes := []string{"image/", "video/", "audio/"}
	for _, prefix := range defaultPrefixes {
		if strings.HasPrefix(contentType, prefix) {
			return true
		}
	}

	defaultTypes := map[string]bool{
		"application/pdf": true,
		"application/zip": true,
		"text/plain":      true,
	}
	return defaultTypes[contentType]
}
