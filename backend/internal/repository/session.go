package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
)

type SessionRepository struct{}

func NewSessionRepository() *SessionRepository {
	return &SessionRepository{}
}

func (r *SessionRepository) Create(session *models.UserSession) error {
	return database.DB.Create(session).Error
}

func (r *SessionRepository) FindByID(id uuid.UUID) (*models.UserSession, error) {
	var session models.UserSession
	err := database.DB.First(&session, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) FindByTokenHash(tokenHash string) (*models.UserSession, error) {
	var session models.UserSession
	err := database.DB.First(&session, "token_hash = ?", tokenHash).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) FindByUserID(userID uuid.UUID) ([]models.UserSession, error) {
	var sessions []models.UserSession
	err := database.DB.
		Where("user_id = ?", userID).
		Order("last_active_at DESC").
		Find(&sessions).Error
	return sessions, err
}

func (r *SessionRepository) Update(session *models.UserSession) error {
	return database.DB.Save(session).Error
}

func (r *SessionRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.UserSession{}, "id = ?", id).Error
}

func (r *SessionRepository) DeleteByUserID(userID uuid.UUID) error {
	return database.DB.Delete(&models.UserSession{}, "user_id = ?", userID).Error
}

func (r *SessionRepository) DeleteOtherSessions(userID uuid.UUID, exceptSessionID uuid.UUID) error {
	return database.DB.
		Delete(&models.UserSession{}, "user_id = ? AND id != ?", userID, exceptSessionID).
		Error
}

func (r *SessionRepository) SetCurrentSession(userID uuid.UUID, sessionID uuid.UUID) error {
	// First, unset all current sessions for this user
	if err := database.DB.Model(&models.UserSession{}).
		Where("user_id = ?", userID).
		Update("is_current", false).Error; err != nil {
		return err
	}
	// Then set the specified session as current
	return database.DB.Model(&models.UserSession{}).
		Where("id = ?", sessionID).
		Update("is_current", true).Error
}

func (r *SessionRepository) UpdateLastActive(id uuid.UUID) error {
	return database.DB.Model(&models.UserSession{}).
		Where("id = ?", id).
		Update("last_active_at", time.Now()).Error
}

func (r *SessionRepository) DeleteExpired() error {
	return database.DB.
		Where("expires_at < ?", time.Now()).
		Delete(&models.UserSession{}).Error
}

func (r *SessionRepository) CountByUserID(userID uuid.UUID) (int64, error) {
	var count int64
	err := database.DB.Model(&models.UserSession{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *SessionRepository) DeleteOldestByUserID(userID uuid.UUID) error {
	var session models.UserSession
	err := database.DB.
		Where("user_id = ?", userID).
		Order("created_at ASC").
		First(&session).Error
	if err != nil {
		return err
	}
	return r.Delete(session.ID)
}
