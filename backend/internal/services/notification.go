package services

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	listWatcherRepo  *repository.ListWatcherRepository
	listRepo         *repository.ListRepository
	boardRepo        *repository.BoardRepository
}

func NewNotificationService() *NotificationService {
	return &NotificationService{
		notificationRepo: repository.NewNotificationRepository(),
		listWatcherRepo:  repository.NewListWatcherRepository(),
		listRepo:         repository.NewListRepository(),
		boardRepo:        repository.NewBoardRepository(),
	}
}

// Create creates a new notification
func (s *NotificationService) Create(notification *models.Notification) error {
	return s.notificationRepo.Create(notification)
}

// GetByUserIDPaginated gets notifications for a user with pagination
func (s *NotificationService) GetByUserIDPaginated(userID uuid.UUID, limit, offset int, unreadOnly bool) ([]models.Notification, int64, error) {
	return s.notificationRepo.FindByUserIDPaginated(userID, limit, offset, unreadOnly)
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(notificationID, userID uuid.UUID) error {
	notification, err := s.notificationRepo.FindByID(notificationID)
	if err != nil {
		return err
	}
	if notification.UserID != userID {
		return nil // Silently ignore if not owner
	}
	return s.notificationRepo.MarkAsRead(notificationID)
}

// MarkAsUnread marks a notification as unread
func (s *NotificationService) MarkAsUnread(notificationID, userID uuid.UUID) error {
	notification, err := s.notificationRepo.FindByID(notificationID)
	if err != nil {
		return err
	}
	if notification.UserID != userID {
		return nil // Silently ignore if not owner
	}
	return s.notificationRepo.MarkAsUnread(notificationID)
}

// MarkAllAsRead marks all notifications for a user as read
func (s *NotificationService) MarkAllAsRead(userID uuid.UUID) error {
	return s.notificationRepo.MarkAllAsRead(userID)
}

// GetUnreadCount gets unread notification count
func (s *NotificationService) GetUnreadCount(userID uuid.UUID) (int64, error) {
	return s.notificationRepo.GetUnreadCount(userID)
}

// NotifyListWatchers creates notifications for all watchers of a list
func (s *NotificationService) NotifyListWatchers(listID uuid.UUID, excludeUserID uuid.UUID, notifType, title, message string, cardID *uuid.UUID) ([]models.Notification, error) {
	watchers, err := s.listWatcherRepo.GetWatchers(listID)
	if err != nil {
		return nil, err
	}

	list, err := s.listRepo.FindByID(listID)
	if err != nil {
		return nil, err
	}

	var notifications []models.Notification
	for _, watcherUserID := range watchers {
		// Don't notify the user who triggered the action
		if watcherUserID == excludeUserID {
			continue
		}

		notification := models.Notification{
			UserID:  watcherUserID,
			Type:    notifType,
			Title:   title,
			Message: message,
			BoardID: list.BoardID,
			ListID:  &listID,
			CardID:  cardID,
		}

		if err := s.notificationRepo.Create(&notification); err != nil {
			continue
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

// Watch subscribes a user to a list
func (s *NotificationService) Watch(listID, userID uuid.UUID) error {
	if s.listWatcherRepo.IsWatching(listID, userID) {
		return nil // Already watching
	}
	watcher := &models.ListWatcher{
		ListID: listID,
		UserID: userID,
	}
	return s.listWatcherRepo.Create(watcher)
}

// Unwatch unsubscribes a user from a list
func (s *NotificationService) Unwatch(listID, userID uuid.UUID) error {
	return s.listWatcherRepo.Delete(listID, userID)
}

// IsWatching checks if a user is watching a list
func (s *NotificationService) IsWatching(listID, userID uuid.UUID) bool {
	return s.listWatcherRepo.IsWatching(listID, userID)
}

// NotifyBoardWatchers creates notifications for all watchers of a board
func (s *NotificationService) NotifyBoardWatchers(boardID uuid.UUID, excludeUserID uuid.UUID, notifType, title, message string, listID, cardID *uuid.UUID) ([]models.Notification, error) {
	watchers, err := s.boardRepo.GetWatchers(boardID)
	if err != nil {
		return nil, err
	}

	var notifications []models.Notification
	for _, watcherUserID := range watchers {
		// Don't notify the user who triggered the action
		if watcherUserID == excludeUserID {
			continue
		}

		notification := models.Notification{
			UserID:  watcherUserID,
			Type:    notifType,
			Title:   title,
			Message: message,
			BoardID: boardID,
			ListID:  listID,
			CardID:  cardID,
		}

		if err := s.notificationRepo.Create(&notification); err != nil {
			continue
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}
