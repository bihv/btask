package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type SystemLabelRepository struct{}

func NewSystemLabelRepository() *SystemLabelRepository {
	return &SystemLabelRepository{}
}

// FindAllPaginated returns labels with pagination, search, and category filter
// Search looks in key, default_value, AND translation values
func (r *SystemLabelRepository) FindAllPaginated(page, limit int, search, category string) ([]models.SystemLabel, int64, error) {
	var labels []models.SystemLabel
	var total int64

	query := database.DB.Model(&models.SystemLabel{})

	// Apply filters
	if search != "" {
		searchPattern := "%" + search + "%"
		// Search in key, default_value, or any translation value
		query = query.Where(
			"key ILIKE ? OR default_value ILIKE ? OR id IN (SELECT label_id FROM system_translations WHERE value ILIKE ?)",
			searchPattern, searchPattern, searchPattern,
		)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get data
	offset := (page - 1) * limit
	err := query.Preload("Translations").Order("key ASC").Offset(offset).Limit(limit).Find(&labels).Error
	if err != nil {
		return nil, 0, err
	}

	return labels, total, nil
}

// FindByID returns a label by ID with translations
func (r *SystemLabelRepository) FindByID(id uuid.UUID) (*models.SystemLabel, error) {
	var label models.SystemLabel
	err := database.DB.Preload("Translations").First(&label, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &label, nil
}

// FindByKey returns a label by key
func (r *SystemLabelRepository) FindByKey(key string) (*models.SystemLabel, error) {
	var label models.SystemLabel
	err := database.DB.Preload("Translations").First(&label, "key = ?", key).Error
	if err != nil {
		return nil, err
	}
	return &label, nil
}

// FindByCategory returns labels by category
func (r *SystemLabelRepository) FindByCategory(category string) ([]models.SystemLabel, error) {
	var labels []models.SystemLabel
	err := database.DB.Preload("Translations").Where("category = ?", category).Order("key ASC").Find(&labels).Error
	return labels, err
}

// GetResolvedLabels returns all labels resolved to the specified language with fallback to default
func (r *SystemLabelRepository) GetResolvedLabels(language string) (map[string]string, error) {
	var labels []models.SystemLabel
	err := database.DB.Preload("Translations").Find(&labels).Error
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, label := range labels {
		// Default to default_value
		value := label.DefaultValue

		// Check for translation in specified language
		for _, t := range label.Translations {
			if t.Language == language {
				value = t.Value
				break
			}
		}
		result[label.Key] = value
	}
	return result, nil
}

// Update updates a label
func (r *SystemLabelRepository) Update(label *models.SystemLabel) error {
	return database.DB.Save(label).Error
}

// --- Translation methods ---

// FindTranslationByID returns a translation by ID
func (r *SystemLabelRepository) FindTranslationByID(id uuid.UUID) (*models.SystemTranslation, error) {
	var translation models.SystemTranslation
	err := database.DB.First(&translation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &translation, nil
}

// CreateTranslation creates a new translation
func (r *SystemLabelRepository) CreateTranslation(translation *models.SystemTranslation) error {
	return database.DB.Create(translation).Error
}

// UpdateTranslation updates a translation
func (r *SystemLabelRepository) UpdateTranslation(translation *models.SystemTranslation) error {
	return database.DB.Save(translation).Error
}

// FindAll returns all labels with translations
func (r *SystemLabelRepository) FindAll(dest *[]models.SystemLabel) error {
	return database.DB.Preload("Translations").Order("key ASC").Find(dest).Error
}

// TranslationExists checks if a translation exists for label + language
func (r *SystemLabelRepository) TranslationExists(labelID uuid.UUID, language string) bool {
	var count int64
	database.DB.Model(&models.SystemTranslation{}).Where("label_id = ? AND language = ?", labelID, language).Count(&count)
	return count > 0
}

// BulkInsert consistently inserts labels and translations
// It assumes the labels passed DO NOT exist in the DB (ID collisions are handled by DB auto-gen)
func (r *SystemLabelRepository) BulkInsert(tx *gorm.DB, items []models.LabelSeed) error {
	if len(items) == 0 {
		return nil
	}

	// 1. Prepare Labels for batch insert
	var labels []*models.SystemLabel
	for _, item := range items {
		labels = append(labels, &models.SystemLabel{
			Key:          item.Key,
			Category:     item.Category,
			DefaultValue: item.DefaultValue,
			Description:  item.Description,
		})
	}

	// 2. Batch insert labels
	if err := tx.Create(labels).Error; err != nil {
		return err
	}

	// 3. Prepare Translations
	var translations []models.SystemTranslation
	for i, item := range items {
		// labels[i].ID is populated by GORM after Create
		for lang, val := range item.Translations {
			translations = append(translations, models.SystemTranslation{
				LabelID:  labels[i].ID,
				Language: lang,
				Value:    val,
			})
		}
	}

	// 4. Batch insert translations
	if len(translations) > 0 {
		if err := tx.Create(&translations).Error; err != nil {
			return err
		}
	}

	return nil
}

// ReplaceAll deletes all existing labels and re-seeds them
func (r *SystemLabelRepository) ReplaceAll(items []models.LabelSeed) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Delete all existing labels (Cascade deletes translations)
		if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.SystemLabel{}).Error; err != nil {
			return err
		}

		// 2. Bulk Insert new ones
		return r.BulkInsert(tx, items)
	})
}
