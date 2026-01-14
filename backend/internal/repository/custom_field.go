package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type CustomFieldRepository struct{}

func NewCustomFieldRepository() *CustomFieldRepository {
	return &CustomFieldRepository{}
}

// CustomField CRUD

func (r *CustomFieldRepository) Create(field *models.CustomField) error {
	return database.DB.Create(field).Error
}

func (r *CustomFieldRepository) FindByID(id uuid.UUID) (*models.CustomField, error) {
	var field models.CustomField
	err := database.DB.Preload("Options", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&field, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &field, nil
}

func (r *CustomFieldRepository) FindByBoardID(boardID uuid.UUID) ([]models.CustomField, error) {
	var fields []models.CustomField
	err := database.DB.
		Preload("Options", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Where("board_id = ?", boardID).
		Order("position ASC").
		Find(&fields).Error
	if err != nil {
		return nil, err
	}
	return fields, nil
}

func (r *CustomFieldRepository) Update(field *models.CustomField) error {
	return database.DB.Save(field).Error
}

func (r *CustomFieldRepository) Delete(id uuid.UUID) error {
	// Delete associated card values first
	database.DB.Where("custom_field_id = ?", id).Delete(&models.CardCustomFieldValue{})
	// Delete options
	database.DB.Where("custom_field_id = ?", id).Delete(&models.CustomFieldOption{})
	// Delete the field
	return database.DB.Delete(&models.CustomField{}, "id = ?", id).Error
}

func (r *CustomFieldRepository) GetMaxPosition(boardID uuid.UUID) int {
	var maxPos int
	database.DB.Model(&models.CustomField{}).
		Where("board_id = ?", boardID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	return maxPos
}

func (r *CustomFieldRepository) ExistsByNameAndBoard(name string, boardID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.CustomField{}).
		Where("name = ? AND board_id = ?", name, boardID).
		Count(&count)
	return count > 0
}

// CustomField Options

func (r *CustomFieldRepository) CreateOption(option *models.CustomFieldOption) error {
	return database.DB.Create(option).Error
}

func (r *CustomFieldRepository) FindOptionByID(id uuid.UUID) (*models.CustomFieldOption, error) {
	var option models.CustomFieldOption
	err := database.DB.Preload("CustomField").First(&option, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &option, nil
}

func (r *CustomFieldRepository) UpdateOption(option *models.CustomFieldOption) error {
	return database.DB.Save(option).Error
}

func (r *CustomFieldRepository) DeleteOption(id uuid.UUID) error {
	// Clear option references in card values
	database.DB.Model(&models.CardCustomFieldValue{}).
		Where("option_id = ?", id).
		Update("option_id", nil)
	return database.DB.Delete(&models.CustomFieldOption{}, "id = ?", id).Error
}

func (r *CustomFieldRepository) GetOptionMaxPosition(fieldID uuid.UUID) int {
	var maxPos int
	database.DB.Model(&models.CustomFieldOption{}).
		Where("custom_field_id = ?", fieldID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	return maxPos
}

// Card Custom Field Values

func (r *CustomFieldRepository) SetCardValue(value *models.CardCustomFieldValue) error {
	// Upsert: update existing or create new
	var existing models.CardCustomFieldValue
	err := database.DB.Where("card_id = ? AND custom_field_id = ?", value.CardID, value.CustomFieldID).
		First(&existing).Error
	if err == nil {
		// Update existing
		existing.Value = value.Value
		existing.OptionID = value.OptionID
		return database.DB.Save(&existing).Error
	}
	// Create new
	return database.DB.Create(value).Error
}

func (r *CustomFieldRepository) GetCardValues(cardID uuid.UUID) ([]models.CardCustomFieldValue, error) {
	var values []models.CardCustomFieldValue
	err := database.DB.
		Preload("CustomField").
		Preload("CustomField.Options").
		Preload("Option").
		Where("card_id = ?", cardID).
		Find(&values).Error
	if err != nil {
		return nil, err
	}
	return values, nil
}

func (r *CustomFieldRepository) DeleteCardValue(cardID, customFieldID uuid.UUID) error {
	return database.DB.Where("card_id = ? AND custom_field_id = ?", cardID, customFieldID).
		Delete(&models.CardCustomFieldValue{}).Error
}

// GetBoardIDByFieldID returns the board ID for a custom field
func (r *CustomFieldRepository) GetBoardIDByFieldID(fieldID uuid.UUID) (uuid.UUID, error) {
	var field models.CustomField
	err := database.DB.Select("board_id").First(&field, "id = ?", fieldID).Error
	if err != nil {
		return uuid.Nil, err
	}
	return field.BoardID, nil
}

// GetBoardIDByOptionID returns the board ID for an option
func (r *CustomFieldRepository) GetBoardIDByOptionID(optionID uuid.UUID) (uuid.UUID, error) {
	var option models.CustomFieldOption
	err := database.DB.Preload("CustomField").First(&option, "id = ?", optionID).Error
	if err != nil {
		return uuid.Nil, err
	}
	return option.CustomField.BoardID, nil
}
