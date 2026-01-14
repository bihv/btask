package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
)

type CommentRepository struct{}

func NewCommentRepository() *CommentRepository {
	return &CommentRepository{}
}

func (r *CommentRepository) Create(comment *models.Comment) error {
	return database.DB.Create(comment).Error
}

func (r *CommentRepository) FindByID(id uuid.UUID) (*models.Comment, error) {
	var comment models.Comment
	err := database.DB.Preload("User").First(&comment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *CommentRepository) FindByCardID(cardID uuid.UUID) ([]models.Comment, error) {
	var comments []models.Comment
	err := database.DB.
		Where("card_id = ?", cardID).
		Order("created_at DESC").
		Preload("User").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}
	return comments, nil
}

func (r *CommentRepository) Update(comment *models.Comment) error {
	return database.DB.Save(comment).Error
}

func (r *CommentRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.Comment{}, "id = ?", id).Error
}
