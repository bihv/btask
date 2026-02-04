package repository

import (
	"time"

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

// GetByCardIDAndSource returns attachments filtered by source
func (r *AttachmentRepository) GetByCardIDAndSource(cardID uuid.UUID, source models.AttachmentSource) ([]models.Attachment, error) {
	var attachments []models.Attachment
	err := database.DB.Where("card_id = ? AND source = ?", cardID, source).
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

// GetByFileURL finds attachment by file URL
func (r *AttachmentRepository) GetByFileURL(fileURL string) (*models.Attachment, error) {
	var attachment models.Attachment
	err := database.DB.Preload("Uploader").First(&attachment, "file_url = ?", fileURL).Error
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

// MarkAsOrphan marks an attachment as orphan
func (r *AttachmentRepository) MarkAsOrphan(id uuid.UUID) error {
	now := time.Now()
	return database.DB.Model(&models.Attachment{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_orphan":   true,
			"orphaned_at": now,
		}).Error
}

// UnmarkOrphan removes orphan status from an attachment
func (r *AttachmentRepository) UnmarkOrphan(id uuid.UUID) error {
	return database.DB.Model(&models.Attachment{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_orphan":   false,
			"orphaned_at": nil,
		}).Error
}

// GetOrphanedAttachments returns attachments that have been orphan for more than X days
func (r *AttachmentRepository) GetOrphanedAttachments(olderThanDays int) ([]models.Attachment, error) {
	var attachments []models.Attachment
	cutoffTime := time.Now().AddDate(0, 0, -olderThanDays)
	err := database.DB.Where("is_orphan = ? AND orphaned_at < ?", true, cutoffTime).
		Find(&attachments).Error
	return attachments, err
}

// GetEditorAttachmentsByCardID returns all editor attachments for a card
func (r *AttachmentRepository) GetEditorAttachmentsByCardID(cardID uuid.UUID) ([]models.Attachment, error) {
	var attachments []models.Attachment
	err := database.DB.Where("card_id = ? AND source = ?", cardID, models.AttachmentSourceEditor).
		Find(&attachments).Error
	return attachments, err
}

// DeleteByID deletes an attachment and returns the deleted attachment for file cleanup
func (r *AttachmentRepository) DeleteByID(id uuid.UUID) (*models.Attachment, error) {
	attachment, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	if err := r.Delete(id); err != nil {
		return nil, err
	}

	return attachment, nil
}
