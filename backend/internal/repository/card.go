package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
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

// GetListByCardID returns the list that contains the card
func (r *CardRepository) GetListByCardID(cardID uuid.UUID) (*models.List, error) {
	var card models.Card
	err := database.DB.Select("list_id").First(&card, "id = ?", cardID).Error
	if err != nil {
		return nil, err
	}

	var list models.List
	err = database.DB.First(&list, "id = ?", card.ListID).Error
	if err != nil {
		return nil, err
	}
	return &list, nil
}

// FindByAssignedUserID returns all non-archived cards where the user is a member with optional filters
func (r *CardRepository) FindByAssignedUserID(userID uuid.UUID, filter models.CardFilterRequest) ([]models.Card, error) {
	var cards []models.Card
	query := database.DB.
		Joins("JOIN card_members ON card_members.card_id = cards.id").
		Joins("JOIN lists ON lists.id = cards.list_id").
		Joins("JOIN boards ON boards.id = lists.board_id").
		Where("card_members.user_id = ? AND cards.is_archived = ?", userID, false)

	// Keyword filter
	if filter.Keyword != "" {
		query = query.Where("cards.title ILIKE ?", "%"+filter.Keyword+"%")
	}

	// Status filter
	if filter.IsComplete != nil && *filter.IsComplete && (filter.IsIncomplete == nil || !*filter.IsIncomplete) {
		query = query.Where("cards.is_completed = ?", true)
	} else if filter.IsIncomplete != nil && *filter.IsIncomplete && (filter.IsComplete == nil || !*filter.IsComplete) {
		query = query.Where("cards.is_completed = ?", false)
	}

	// Due date filters (these are OR conditions)
	dueDateConditions := []string{}
	dueDateArgs := []interface{}{}

	if filter.NoDueDate {
		dueDateConditions = append(dueDateConditions, "cards.due_date IS NULL")
	}
	if filter.Overdue {
		dueDateConditions = append(dueDateConditions, "cards.due_date < NOW()")
	}
	if filter.DueNextDay {
		dueDateConditions = append(dueDateConditions, "(cards.due_date >= NOW() AND cards.due_date <= NOW() + INTERVAL '1 day')")
	}
	if filter.DueNextWeek {
		dueDateConditions = append(dueDateConditions, "(cards.due_date >= NOW() AND cards.due_date <= NOW() + INTERVAL '7 days')")
	}
	if filter.DueNextMonth {
		dueDateConditions = append(dueDateConditions, "(cards.due_date >= NOW() AND cards.due_date <= NOW() + INTERVAL '30 days')")
	}

	if len(dueDateConditions) > 0 {
		combined := "(" + dueDateConditions[0]
		for i := 1; i < len(dueDateConditions); i++ {
			combined += " OR " + dueDateConditions[i]
		}
		combined += ")"
		query = query.Where(combined, dueDateArgs...)
	}

	// Board filter
	if len(filter.BoardIDs) > 0 {
		query = query.Where("boards.id IN ?", filter.BoardIDs)
	}

	// Activity filters (these are OR conditions)
	activityConditions := []string{}

	if filter.ActiveLastDay {
		activityConditions = append(activityConditions, "cards.updated_at >= NOW() - INTERVAL '1 day'")
	}
	if filter.ActiveLastWeek {
		activityConditions = append(activityConditions, "cards.updated_at >= NOW() - INTERVAL '7 days'")
	}
	if filter.ActiveLastMonth {
		activityConditions = append(activityConditions, "cards.updated_at >= NOW() - INTERVAL '30 days'")
	}
	if filter.ActiveLastYear {
		activityConditions = append(activityConditions, "cards.updated_at >= NOW() - INTERVAL '365 days'")
	}

	if len(activityConditions) > 0 {
		combined := "(" + activityConditions[0]
		for i := 1; i < len(activityConditions); i++ {
			combined += " OR " + activityConditions[i]
		}
		combined += ")"
		query = query.Where(combined)
	}

	err := query.
		Preload("Labels.Label").
		Preload("Members.User").
		Preload("List.Board.Workspace").
		Order("cards.due_date ASC NULLS LAST, cards.updated_at DESC").
		Find(&cards).Error
	if err != nil {
		return nil, err
	}
	return cards, nil
}
