package repository

import (
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/models"
	"github.com/google/uuid"
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
	err := database.DB.Preload("Owner").Preload("Boards").First(&workspace, "id = ?", id).Error
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
		Find(&workspaces).Error

	if err != nil {
		return nil, err
	}

	// Count boards for each workspace
	for i := range workspaces {
		var count int64
		database.DB.Model(&models.Board{}).Where("workspace_id = ?", workspaces[i].ID).Count(&count)
		workspaces[i].BoardCount = int(count)
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
