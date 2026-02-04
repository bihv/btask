package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
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
		Preload("Lists.Cards.CustomFieldValues.CustomField").
		Preload("Lists.Cards.CustomFieldValues.Option").
		Preload("Labels").
		Preload("CustomFields.Options", func(db *gorm.DB) *gorm.DB {
			return db.Order("custom_field_options.position ASC")
		}).
		First(&board, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &board, nil
}

// FindByIDWithDetails finds a board with all lists, cards, and labels for copying
func (r *BoardRepository) FindByIDWithDetails(id uuid.UUID) (*models.Board, error) {
	var board models.Board
	err := database.DB.
		Preload("Lists", func(db *gorm.DB) *gorm.DB {
			return db.Order("lists.position ASC")
		}).
		Preload("Lists.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("cards.position ASC")
		}).
		Preload("Lists.Cards.Labels.Label").
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

// SearchByTitle searches boards by title that the user has access to
func (r *BoardRepository) SearchByTitle(userID uuid.UUID, query string, limit int) ([]models.Board, error) {
	var boards []models.Board
	err := database.DB.
		Joins("JOIN workspaces ON workspaces.id = boards.workspace_id").
		Joins("LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id").
		Where("(workspaces.owner_id = ? OR workspace_members.user_id = ?) AND LOWER(boards.title) LIKE LOWER(?)",
			userID, userID, "%"+query+"%").
		Distinct().
		Preload("Workspace").
		Limit(limit).
		Find(&boards).Error
	if err != nil {
		return nil, err
	}
	return boards, nil
}

// RecordView records or updates when a user views a board
func (r *BoardRepository) RecordView(boardID uuid.UUID, userID uuid.UUID) error {
	view := &models.BoardView{
		BoardID:  boardID,
		UserID:   userID,
		ViewedAt: time.Now(),
	}
	// Upsert: update viewed_at if exists, otherwise create
	return database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).
		Assign(models.BoardView{ViewedAt: time.Now()}).
		FirstOrCreate(view).Error
}

// GetRecentlyViewed returns recently viewed boards for a user
func (r *BoardRepository) GetRecentlyViewed(userID uuid.UUID, limit int) ([]models.Board, error) {
	var boardViews []models.BoardView
	err := database.DB.
		Where("user_id = ?", userID).
		Order("viewed_at DESC").
		Limit(limit).
		Find(&boardViews).Error
	if err != nil {
		return nil, err
	}

	if len(boardViews) == 0 {
		return []models.Board{}, nil
	}

	// Get board IDs in order
	boardIDs := make([]uuid.UUID, len(boardViews))
	for i, bv := range boardViews {
		boardIDs[i] = bv.BoardID
	}

	// Fetch boards
	var boards []models.Board
	err = database.DB.
		Where("id IN ?", boardIDs).
		Find(&boards).Error
	if err != nil {
		return nil, err
	}

	// Create a map for quick lookup
	boardMap := make(map[uuid.UUID]models.Board)
	for _, b := range boards {
		boardMap[b.ID] = b
	}

	// Reorder boards to match view order
	result := make([]models.Board, 0, len(boardViews))
	for _, bv := range boardViews {
		if board, ok := boardMap[bv.BoardID]; ok {
			result = append(result, board)
		}
	}

	return result, nil
}

// GetMembers returns all members of a board
func (r *BoardRepository) GetMembers(boardID uuid.UUID) ([]models.BoardMember, error) {
	var members []models.BoardMember
	err := database.DB.
		Preload("User").
		Where("board_id = ?", boardID).
		Find(&members).Error
	return members, err
}

// AddMember adds a member to a board
func (r *BoardRepository) AddMember(member *models.BoardMember) error {
	return database.DB.Create(member).Error
}

// RemoveMember removes a member from a board
func (r *BoardRepository) RemoveMember(boardID uuid.UUID, userID uuid.UUID) error {
	return database.DB.
		Where("board_id = ? AND user_id = ?", boardID, userID).
		Delete(&models.BoardMember{}).Error
}

// IsMember checks if a user is a member of a board
func (r *BoardRepository) IsMember(boardID uuid.UUID, userID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.BoardMember{}).
		Where("board_id = ? AND user_id = ?", boardID, userID).
		Count(&count)
	return count > 0
}
