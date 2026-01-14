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
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Get all card IDs in this list
		var cardIDs []uuid.UUID
		if err := tx.Model(&models.Card{}).Where("list_id = ?", id).Pluck("id", &cardIDs).Error; err != nil {
			return err
		}

		if len(cardIDs) > 0 {
			// Delete card related data
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.CardLabel{}).Error; err != nil {
				return err
			}
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.CardMember{}).Error; err != nil {
				return err
			}
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.Comment{}).Error; err != nil {
				return err
			}
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.CardCustomFieldValue{}).Error; err != nil {
				return err
			}
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.Attachment{}).Error; err != nil {
				return err
			}
			// Delete checklist items first, then checklists
			var checklistIDs []uuid.UUID
			if err := tx.Model(&models.Checklist{}).Where("card_id IN ?", cardIDs).Pluck("id", &checklistIDs).Error; err != nil {
				return err
			}
			if len(checklistIDs) > 0 {
				if err := tx.Where("checklist_id IN ?", checklistIDs).Delete(&models.ChecklistItem{}).Error; err != nil {
					return err
				}
			}
			if err := tx.Where("card_id IN ?", cardIDs).Delete(&models.Checklist{}).Error; err != nil {
				return err
			}
			// Delete cards
			if err := tx.Where("list_id = ?", id).Delete(&models.Card{}).Error; err != nil {
				return err
			}
		}

		// Delete list watchers
		if err := tx.Where("list_id = ?", id).Delete(&models.ListWatcher{}).Error; err != nil {
			return err
		}

		// Delete the list
		return tx.Delete(&models.List{}, "id = ?", id).Error
	})
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

		// Skip if position hasn't changed
		if oldPosition == newPosition {
			return nil
		}

		if oldPosition < newPosition {
			// Moving right: shift lists between old and new position to the left
			if err := tx.Model(&models.List{}).
				Where("board_id = ? AND position > ? AND position <= ?", boardID, oldPosition, newPosition).
				Update("position", gorm.Expr("position - 1")).Error; err != nil {
				return err
			}
		} else {
			// Moving left: shift lists between new and old position to the right
			if err := tx.Model(&models.List{}).
				Where("board_id = ? AND position >= ? AND position < ?", boardID, newPosition, oldPosition).
				Update("position", gorm.Expr("position + 1")).Error; err != nil {
				return err
			}
		}

		// Update the moved list's position
		return tx.Model(&list).Update("position", newPosition).Error
	})
}

func (r *ListRepository) Archive(listID uuid.UUID) error {
	return database.DB.Model(&models.List{}).Where("id = ?", listID).Update("is_archived", true).Error
}

func (r *ListRepository) Unarchive(listID uuid.UUID) error {
	return database.DB.Model(&models.List{}).Where("id = ?", listID).Update("is_archived", false).Error
}

func (r *ListRepository) ArchiveAllCards(listID uuid.UUID) error {
	return database.DB.Model(&models.Card{}).Where("list_id = ?", listID).Update("is_archived", true).Error
}

func (r *ListRepository) FindArchivedByBoardID(boardID uuid.UUID) ([]models.List, error) {
	var lists []models.List
	err := database.DB.
		Where("board_id = ? AND is_archived = ?", boardID, true).
		Order("updated_at DESC").
		Find(&lists).Error
	if err != nil {
		return nil, err
	}
	return lists, nil
}

func (r *ListRepository) SetAllListsCollapsed(boardID uuid.UUID, collapsed bool) error {
	return database.DB.Model(&models.List{}).
		Where("board_id = ? AND is_archived = ?", boardID, false).
		Update("is_collapsed", collapsed).Error
}
