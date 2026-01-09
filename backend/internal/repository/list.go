package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListRepository struct{}

func NewListRepository() *ListRepository {
	return &ListRepository{}
}

func (r *ListRepository) Create(list *models.List) error {
	return database.DB.Create(list).Error
}

func (r *ListRepository) FindByID(id uuid.UUID) (*models.List, error) {
	var list models.List
	err := database.DB.
		Preload("Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("cards.position ASC")
		}).
		First(&list, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &list, nil
}

func (r *ListRepository) FindByBoardID(boardID uuid.UUID) ([]models.List, error) {
	var lists []models.List
	err := database.DB.
		Where("board_id = ?", boardID).
		Order("position ASC").
		Preload("Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("cards.position ASC")
		}).
		Find(&lists).Error
	if err != nil {
		return nil, err
	}
	return lists, nil
}

func (r *ListRepository) Update(list *models.List) error {
	return database.DB.Save(list).Error
}

func (r *ListRepository) Delete(id uuid.UUID) error {
	// Delete all cards in the list first
	database.DB.Delete(&models.Card{}, "list_id = ?", id)
	return database.DB.Delete(&models.List{}, "id = ?", id).Error
}

func (r *ListRepository) GetMaxPosition(boardID uuid.UUID) int {
	var maxPos int
	database.DB.Model(&models.List{}).
		Where("board_id = ?", boardID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	return maxPos
}

func (r *ListRepository) ReorderLists(boardID uuid.UUID, listID uuid.UUID, newPosition int) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var list models.List
		if err := tx.First(&list, "id = ?", listID).Error; err != nil {
			return err
		}

		oldPosition := list.Position

		if oldPosition < newPosition {
			tx.Model(&models.List{}).
				Where("board_id = ? AND position > ? AND position <= ?", boardID, oldPosition, newPosition).
				Update("position", gorm.Expr("position - 1"))
		} else if oldPosition > newPosition {
			tx.Model(&models.List{}).
				Where("board_id = ? AND position >= ? AND position < ?", boardID, newPosition, oldPosition).
				Update("position", gorm.Expr("position + 1"))
		}

		list.Position = newPosition
		return tx.Save(&list).Error
	})
}
