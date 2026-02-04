package seeders

import (
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/pkg/logger"
	"gorm.io/gorm"
)

// SeedSystemSettings creates default system settings if not exists
func SeedSystemSettings(db *gorm.DB) error {
	var count int64
	db.Model(&models.SystemSettings{}).Count(&count)

	if count > 0 {
		logger.Info("System settings already exist, skipping seed")
		return nil
	}

	settings := models.SystemSettings{
		ID:                   1,
		OrphanCleanupDays:    7,
		OrphanCleanupEnabled: true,
		MaxUploadSizeMB:      50,
		AllowedFileTypes: models.AllowedFileTypesConfig{
			AllowedPrefixes: []string{"image/", "video/", "audio/"},
			AllowedTypes: []string{
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"application/vnd.ms-excel",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"application/vnd.ms-powerpoint",
				"application/vnd.openxmlformats-officedocument.presentationml.presentation",
				"application/zip",
				"application/x-rar-compressed",
				"application/x-7z-compressed",
				"application/gzip",
				"text/plain",
				"text/csv",
				"application/json",
			},
			BlockedTypes: []string{"image/svg+xml"},
		},
	}

	if err := db.Create(&settings).Error; err != nil {
		logger.Error("Failed to seed system settings")
		return err
	}

	logger.Info("System settings seeded successfully")
	return nil
}
