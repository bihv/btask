package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
)

type LabelRepository struct{}

func NewLabelRepository() *LabelRepository {
	return &LabelRepository{}
}

func (r *LabelRepository) Create(label *models.Label) error {
	return database.DB.Create(label).Error
}

func (r *LabelRepository) FindByID(id uuid.UUID) (*models.Label, error) {
	var label models.Label
	err := database.DB.First(&label, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &label, nil
}

func (r *LabelRepository) FindByBoardID(boardID uuid.UUID) ([]models.Label, error) {
	var labels []models.Label
	err := database.DB.Where("board_id = ?", boardID).Find(&labels).Error
	if err != nil {
		return nil, err
	}
	return labels, nil
}

func (r *LabelRepository) Update(label *models.Label) error {
	return database.DB.Save(label).Error
}

func (r *LabelRepository) Delete(id uuid.UUID) error {
	// Delete card_labels first
	database.DB.Delete(&models.CardLabel{}, "label_id = ?", id)
	return database.DB.Delete(&models.Label{}, "id = ?", id).Error
}
