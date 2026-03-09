package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type WorkspaceRepository struct{}

func NewWorkspaceRepository() *WorkspaceRepository {
	return &WorkspaceRepository{}
}

func (r *WorkspaceRepository) Create(workspace *models.Workspace) error {
	return database.DB.Create(workspace).Error
}

func (r *WorkspaceRepository) FindByID(id uuid.UUID) (*models.Workspace, error) {
	var workspace models.Workspace
	err := database.DB.Preload("Owner").Preload("Boards", func(db *gorm.DB) *gorm.DB {
		return db.Where("archived_at IS NULL").Order("position ASC")
	}).First(&workspace, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	// Set BoardCount from preloaded Boards
	workspace.BoardCount = len(workspace.Boards)
	return &workspace, nil
}

func (r *WorkspaceRepository) FindByUserID(userID uuid.UUID) ([]models.Workspace, error) {
	var workspaces []models.Workspace

	// Find workspaces where user is owner or member
	err := database.DB.
		Joins("LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id").
		Where("workspaces.owner_id = ? OR workspace_members.user_id = ?", userID, userID).
		Distinct().
		Preload("Owner").
		Preload("Boards", func(db *gorm.DB) *gorm.DB {
			return db.Where("archived_at IS NULL").Order("position ASC")
		}).
		Find(&workspaces).Error

	if err != nil {
		return nil, err
	}

	// Set BoardCount from preloaded Boards
	for i := range workspaces {
		workspaces[i].BoardCount = len(workspaces[i].Boards)
	}

	return workspaces, nil
}

func (r *WorkspaceRepository) Update(workspace *models.Workspace) error {
	return database.DB.Save(workspace).Error
}

func (r *WorkspaceRepository) Delete(id uuid.UUID) error {
	return database.DB.Delete(&models.Workspace{}, "id = ?", id).Error
}

func (r *WorkspaceRepository) AddMember(member *models.WorkspaceMember) error {
	return database.DB.Create(member).Error
}

func (r *WorkspaceRepository) RemoveMember(workspaceID, userID uuid.UUID) error {
	return database.DB.Delete(&models.WorkspaceMember{}, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
}

func (r *WorkspaceRepository) IsMember(workspaceID, userID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.WorkspaceMember{}).
		Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
		Count(&count)
	return count > 0
}

func (r *WorkspaceRepository) IsOwner(workspaceID, userID uuid.UUID) bool {
	var count int64
	database.DB.Model(&models.Workspace{}).
		Where("id = ? AND owner_id = ?", workspaceID, userID).
		Count(&count)
	return count > 0
}

func (r *WorkspaceRepository) GetMembers(workspaceID uuid.UUID) ([]models.WorkspaceMember, error) {
	var members []models.WorkspaceMember
	err := database.DB.Preload("User").Where("workspace_id = ?", workspaceID).Find(&members).Error
	if err != nil {
		return nil, err
	}
	return members, nil
}

// SearchByName searches workspaces by name that the user has access to
func (r *WorkspaceRepository) SearchByName(userID uuid.UUID, query string, limit int) ([]models.Workspace, error) {
	var workspaces []models.Workspace
	err := database.DB.
		Joins("LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id").
		Where("(workspaces.owner_id = ? OR workspace_members.user_id = ?) AND LOWER(workspaces.name) LIKE LOWER(?)",
			userID, userID, "%"+query+"%").
		Distinct().
		Limit(limit).
		Find(&workspaces).Error
	if err != nil {
		return nil, err
	}
	return workspaces, nil
}
