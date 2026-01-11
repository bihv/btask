package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
)

type NotificationRepository struct{}

func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{}
}

func (r *NotificationRepository) Create(notification *models.Notification) error {
	return database.DB.Create(notification).Error
}

func (r *NotificationRepository) FindByUserID(userID uuid.UUID, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	query := database.DB.
		Where("user_id = ?", userID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepository) FindByID(id uuid.UUID) (*models.Notification, error) {
	var notification models.Notification
	err := database.DB.First(&notification, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

func (r *NotificationRepository) MarkAsRead(id uuid.UUID) error {
	return database.DB.Model(&models.Notification{}).
		Where("id = ?", id).
		Update("is_read", true).Error
}

func (r *NotificationRepository) MarkAllAsRead(userID uuid.UUID) error {
	return database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (r *NotificationRepository) GetUnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (r *NotificationRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.Notification{}, "id = ?", id).Error
}
