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

func (r *NotificationRepository) FindByUserIDPaginated(userID uuid.UUID, limit, offset int, unreadOnly bool) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	query := database.DB.Model(&models.Notification{}).Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	dataQuery := database.DB.Where("user_id = ?", userID)
	if unreadOnly {
		dataQuery = dataQuery.Where("is_read = ?", false)
	}
	err := dataQuery.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
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

func (r *NotificationRepository) MarkAsUnread(id uuid.UUID) error {
	return database.DB.Model(&models.Notification{}).
		Where("id = ?", id).
		Update("is_read", false).Error
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
