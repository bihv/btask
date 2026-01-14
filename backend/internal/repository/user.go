package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) Create(user *models.User) error {
	return database.DB.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return database.DB.Save(user).Error
}

func (r *UserRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.User{}, "id = ?", id).Error
}

func (r *UserRepository) EmailExists(email string) bool {
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}
