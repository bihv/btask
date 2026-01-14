package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
)

type AttachmentRepository struct{}

func NewAttachmentRepository() *AttachmentRepository {
	return &AttachmentRepository{}
}

func (r *AttachmentRepository) GetByCardID(cardID uuid.UUID) ([]models.Attachment, error) {
	var attachments []models.Attachment
	err := database.DB.Where("card_id = ?", cardID).
		Preload("Uploader").
		Order("created_at DESC").
		Find(&attachments).Error
	return attachments, err
}

func (r *AttachmentRepository) GetByID(id uuid.UUID) (*models.Attachment, error) {
	var attachment models.Attachment
	err := database.DB.Preload("Uploader").First(&attachment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &attachment, nil
}

func (r *AttachmentRepository) Create(attachment *models.Attachment) error {
	return database.DB.Create(attachment).Error
}

func (r *AttachmentRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.Attachment{}, "id = ?", id).Error
}
