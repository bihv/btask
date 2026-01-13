package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BoardRepository struct{}

func NewBoardRepository() *BoardRepository {
	return &BoardRepository{}
}

func (r *BoardRepository) Create(board *models.Board) error {
	return database.DB.Create(board).Error
}

func (r *BoardRepository) FindByID(id uuid.UUID) (*models.Board, error) {
	var board models.Board
	err := database.DB.
		Preload("Lists", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_archived = ?", false).Order("lists.position ASC")
		}).
		Preload("Lists.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_archived = ?", false).Order("cards.position ASC")
		}).
		Preload("Lists.Cards.Labels.Label").
		Preload("Lists.Cards.Members.User").
		Preload("Labels").
		First(&board, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &board, nil
}

func (r *BoardRepository) FindByWorkspaceID(workspaceID uuid.UUID) ([]models.Board, error) {
	var boards []models.Board
	err := database.DB.
		Where("workspace_id = ?", workspaceID).
		Order("position ASC").
		Find(&boards).Error
	if err != nil {
		return nil, err
	}
	return boards, nil
}

func (r *BoardRepository) Update(board *models.Board) error {
	return database.DB.Save(board).Error
}

func (r *BoardRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.Board{}, "id = ?", id).Error
}

func (r *BoardRepository) GetMaxPosition(workspaceID uuid.UUID) int {
	var maxPos int
	database.DB.Model(&models.Board{}).
		Where("workspace_id = ?", workspaceID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	return maxPos
}

func (r *BoardRepository) AddWatcher(boardID uuid.UUID, userID uuid.UUID) error {
	watcher := &models.BoardWatcher{
		BoardID: boardID,
		UserID:  userID,
	}
	// Use FirstOrCreate to avoid duplicates
	return database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).
		FirstOrCreate(watcher).Error
}

func (r *BoardRepository) RemoveWatcher(boardID uuid.UUID, userID uuid.UUID) error {
	return database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).
		Delete(&models.BoardWatcher{}).Error
}

func (r *BoardRepository) IsWatching(boardID uuid.UUID, userID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.BoardWatcher{}).
		Where("board_id = ? AND user_id = ?", boardID, userID).
		Count(&count)
	return count > 0
}

func (r *BoardRepository) GetWatchers(boardID uuid.UUID) ([]uuid.UUID, error) {
	var watchers []models.BoardWatcher
	err := database.DB.Where("board_id = ?", boardID).Find(&watchers).Error
	if err != nil {
		return nil, err
	}

	var userIDs []uuid.UUID
	for _, w := range watchers {
		userIDs = append(userIDs, w.UserID)
	}
	return userIDs, nil
}
