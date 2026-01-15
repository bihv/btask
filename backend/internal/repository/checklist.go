package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type ChecklistRepository struct{}

func NewChecklistRepository() *ChecklistRepository {
	return &ChecklistRepository{}
}

// Checklist methods
func (r *ChecklistRepository) GetByCardID(cardID uuid.UUID) ([]models.Checklist, error) {
	var checklists []models.Checklist
	err := database.DB.Where("card_id = ?", cardID).
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Preload("Items.Assignees.User").
		Order("position ASC").
		Find(&checklists).Error
	return checklists, err
}

func (r *ChecklistRepository) GetByID(id uuid.UUID) (*models.Checklist, error) {
	var checklist models.Checklist
	err := database.DB.Preload("Items").First(&checklist, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &checklist, nil
}

func (r *ChecklistRepository) Create(checklist *models.Checklist) error {
	// Get max position for this card
	var maxPos int
	database.DB.Model(&models.Checklist{}).
		Where("card_id = ?", checklist.CardID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	checklist.Position = maxPos + 1
	return database.DB.Create(checklist).Error
}

func (r *ChecklistRepository) Update(checklist *models.Checklist) error {
	return database.DB.Save(checklist).Error
}

func (r *ChecklistRepository) Delete(id uuid.UUID) error {
	// Delete all item assignees first
	var itemIDs []uuid.UUID
	database.DB.Model(&models.ChecklistItem{}).Where("checklist_id = ?", id).Pluck("id", &itemIDs)
	if len(itemIDs) > 0 {
		database.DB.Where("checklist_item_id IN ?", itemIDs).Delete(&models.ChecklistItemAssignee{})
	}
	// Delete all items
	database.DB.Where("checklist_id = ?", id).Delete(&models.ChecklistItem{})
	return database.DB.Delete(&models.Checklist{}, "id = ?", id).Error
}

// ChecklistItem methods
func (r *ChecklistRepository) GetItemByID(id uuid.UUID) (*models.ChecklistItem, error) {
	var item models.ChecklistItem
	err := database.DB.Preload("Assignees.User").First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// GetItemWithChecklist gets an item with its full checklist info (for convert to card)
func (r *ChecklistRepository) GetItemWithChecklist(id uuid.UUID) (*models.ChecklistItem, error) {
	var item models.ChecklistItem
	err := database.DB.Preload("Assignees.User").Preload("Checklist").First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *ChecklistRepository) CreateItem(item *models.ChecklistItem) error {
	// Get max position for this checklist
	var maxPos int
	database.DB.Model(&models.ChecklistItem{}).
		Where("checklist_id = ?", item.ChecklistID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	item.Position = maxPos + 1
	return database.DB.Create(item).Error
}

func (r *ChecklistRepository) UpdateItem(item *models.ChecklistItem) error {
	return database.DB.Save(item).Error
}

func (r *ChecklistRepository) DeleteItem(id uuid.UUID) error {
	// Delete assignees first
	database.DB.Where("checklist_item_id = ?", id).Delete(&models.ChecklistItemAssignee{})
	return database.DB.Delete(&models.ChecklistItem{}, "id = ?", id).Error
}

func (r *ChecklistRepository) ToggleItemCompleted(id uuid.UUID) (*models.ChecklistItem, error) {
	item, err := r.GetItemByID(id)
	if err != nil {
		return nil, err
	}
	item.IsCompleted = !item.IsCompleted
	err = r.UpdateItem(item)
	return item, err
}

// SyncItemAssignees syncs the assignees for a checklist item

func (r *ChecklistRepository) SyncItemAssignees(itemID uuid.UUID, userIDs []uuid.UUID) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete all existing assignees
		if err := tx.Where("checklist_item_id = ?", itemID).Delete(&models.ChecklistItemAssignee{}).Error; err != nil {
			return err
		}
		// Add new assignees
		for _, userID := range userIDs {
			assignee := models.ChecklistItemAssignee{
				ChecklistItemID: itemID,
				UserID:          userID,
			}
			if err := tx.Create(&assignee).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
