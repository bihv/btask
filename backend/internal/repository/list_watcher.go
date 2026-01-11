package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
)

type ListWatcherRepository struct{}

func NewListWatcherRepository() *ListWatcherRepository {
	return &ListWatcherRepository{}
}

func (r *ListWatcherRepository) Create(watcher *models.ListWatcher) error {
	return database.DB.Create(watcher).Error
}

func (r *ListWatcherRepository) Delete(listID, userID uuid.UUID) error {
	return database.DB.
		Where("list_id = ? AND user_id = ?", listID, userID).
		Delete(&models.ListWatcher{}).Error
}

func (r *ListWatcherRepository) IsWatching(listID, userID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.ListWatcher{}).
		Where("list_id = ? AND user_id = ?", listID, userID).
		Count(&count)
	return count > 0
}

func (r *ListWatcherRepository) GetWatchers(listID uuid.UUID) ([]uuid.UUID, error) {
	var watchers []models.ListWatcher
	err := database.DB.
		Where("list_id = ?", listID).
		Find(&watchers).Error
	if err != nil {
		return nil, err
	}

	userIDs := make([]uuid.UUID, len(watchers))
	for i, w := range watchers {
		userIDs[i] = w.UserID
	}
	return userIDs, nil
}

func (r *ListWatcherRepository) GetWatchedListsByUser(userID uuid.UUID) ([]uuid.UUID, error) {
	var watchers []models.ListWatcher
	err := database.DB.
		Where("user_id = ?", userID).
		Find(&watchers).Error
	if err != nil {
		return nil, err
	}

	listIDs := make([]uuid.UUID, len(watchers))
	for i, w := range watchers {
		listIDs[i] = w.ListID
	}
	return listIDs, nil
}
