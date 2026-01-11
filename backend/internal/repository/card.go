package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CardRepository struct{}

func NewCardRepository() *CardRepository {
	return &CardRepository{}
}

func (r *CardRepository) Create(card *models.Card) error {
	return database.DB.Create(card).Error
}

func (r *CardRepository) FindByID(id uuid.UUID) (*models.Card, error) {
	var card models.Card
	err := database.DB.
		Preload("Labels.Label").
		Preload("Members.User").
		Preload("Comments.User").
		Preload("Creator").
		First(&card, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *CardRepository) FindByListID(listID uuid.UUID) ([]models.Card, error) {
	var cards []models.Card
	err := database.DB.
		Where("list_id = ? AND is_archived = ?", listID, false).
		Order("position ASC").
		Find(&cards).Error
	if err != nil {
		return nil, err
	}
	return cards, nil
}

func (r *CardRepository) Update(card *models.Card) error {
	return database.DB.Save(card).Error
}

func (r *CardRepository) Delete(id uuid.UUID) error {
	// Delete related data first
	database.DB.Delete(&models.CardLabel{}, "card_id = ?", id)
	database.DB.Delete(&models.CardMember{}, "card_id = ?", id)
	database.DB.Delete(&models.Comment{}, "card_id = ?", id)
	return database.DB.Delete(&models.Card{}, "id = ?", id).Error
}

func (r *CardRepository) GetMaxPosition(listID uuid.UUID) int {
	var maxPos int
	database.DB.Model(&models.Card{}).
		Where("list_id = ?", listID).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)
	return maxPos
}

func (r *CardRepository) MoveCard(cardID uuid.UUID, newListID uuid.UUID, newPosition int) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var card models.Card
		if err := tx.First(&card, "id = ?", cardID).Error; err != nil {
			return err
		}

		oldListID := card.ListID
		oldPosition := card.Position

		// If moving within same list
		if oldListID == newListID {
			if oldPosition < newPosition {
				tx.Model(&models.Card{}).
					Where("list_id = ? AND position > ? AND position <= ?", oldListID, oldPosition, newPosition).
					Update("position", gorm.Expr("position - 1"))
			} else if oldPosition > newPosition {
				tx.Model(&models.Card{}).
					Where("list_id = ? AND position >= ? AND position < ?", oldListID, newPosition, oldPosition).
					Update("position", gorm.Expr("position + 1"))
			}
		} else {
			// Moving to different list
			// Decrease positions in old list
			tx.Model(&models.Card{}).
				Where("list_id = ? AND position > ?", oldListID, oldPosition).
				Update("position", gorm.Expr("position - 1"))

			// Increase positions in new list
			tx.Model(&models.Card{}).
				Where("list_id = ? AND position >= ?", newListID, newPosition).
				Update("position", gorm.Expr("position + 1"))

			card.ListID = newListID
		}

		card.Position = newPosition
		return tx.Save(&card).Error
	})
}

func (r *CardRepository) AddLabel(cardID, labelID uuid.UUID) error {
	cardLabel := models.CardLabel{
		CardID:  cardID,
		LabelID: labelID,
	}
	return database.DB.Create(&cardLabel).Error
}

func (r *CardRepository) RemoveLabel(cardID, labelID uuid.UUID) error {
	return database.DB.Delete(&models.CardLabel{}, "card_id = ? AND label_id = ?", cardID, labelID).Error
}

func (r *CardRepository) AddMember(cardID, userID uuid.UUID) error {
	cardMember := models.CardMember{
		CardID: cardID,
		UserID: userID,
	}
	return database.DB.Create(&cardMember).Error
}

func (r *CardRepository) RemoveMember(cardID, userID uuid.UUID) error {
	return database.DB.Delete(&models.CardMember{}, "card_id = ? AND user_id = ?", cardID, userID).Error
}

func (r *CardRepository) Archive(cardID uuid.UUID) error {
	return database.DB.Model(&models.Card{}).Where("id = ?", cardID).Update("is_archived", true).Error
}

func (r *CardRepository) Unarchive(cardID uuid.UUID) error {
	return database.DB.Model(&models.Card{}).Where("id = ?", cardID).Update("is_archived", false).Error
}

func (r *CardRepository) FindArchivedByBoardID(boardID uuid.UUID) ([]models.Card, error) {
	var cards []models.Card
	err := database.DB.
		Joins("JOIN lists ON lists.id = cards.list_id").
		Where("lists.board_id = ? AND cards.is_archived = ?", boardID, true).
		Preload("Labels.Label").
		Preload("Members.User").
		Preload("Creator").
		Order("cards.updated_at DESC").
		Find(&cards).Error
	if err != nil {
		return nil, err
	}
	return cards, nil
}
