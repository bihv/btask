package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
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

// Create creates a new label
func (r *SystemLabelRepository) Create(label *models.SystemLabel) error {
	return database.DB.Create(label).Error
}

// Update updates a label
func (r *SystemLabelRepository) Update(label *models.SystemLabel) error {
	return database.DB.Save(label).Error
}

// Delete deletes a label (translations cascade)
func (r *SystemLabelRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.SystemLabel{}, "id = ?", id).Error
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

// DeleteTranslation deletes a translation
func (r *SystemLabelRepository) DeleteTranslation(id uuid.UUID) error {
	return database.DB.Delete(&models.SystemTranslation{}, "id = ?", id).Error
}

// TranslationExists checks if a translation exists for label + language
func (r *SystemLabelRepository) TranslationExists(labelID uuid.UUID, language string) bool {
	var count int64
	database.DB.Model(&models.SystemTranslation{}).Where("label_id = ? AND language = ?", labelID, language).Count(&count)
	return count > 0
}
