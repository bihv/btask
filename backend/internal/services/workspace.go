package services

import (
	"errors"

	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/repository"
	"github.com/google/uuid"
)

type WorkspaceService struct {
	workspaceRepo *repository.WorkspaceRepository
}

func NewWorkspaceService() *WorkspaceService {
	return &WorkspaceService{
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *WorkspaceService) Create(userID uuid.UUID, req models.CreateWorkspaceRequest) (*models.Workspace, error) {
	workspace := &models.Workspace{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	if err := s.workspaceRepo.Create(workspace); err != nil {
		return nil, err
	}

	// Add owner as member
	member := &models.WorkspaceMember{
		WorkspaceID: workspace.ID,
		UserID:      userID,
		Role:        "owner",
	}
	if err := s.workspaceRepo.AddMember(member); err != nil {
		return nil, err
	}

	return workspace, nil
}

func (s *WorkspaceService) GetByID(workspaceID uuid.UUID, userID uuid.UUID) (*models.Workspace, error) {
	workspace, err := s.workspaceRepo.FindByID(workspaceID)
	if err != nil {
		return nil, errors.New("workspace not found")
	}

	if !s.hasAccess(workspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return workspace, nil
}

func (s *WorkspaceService) GetUserWorkspaces(userID uuid.UUID) ([]models.Workspace, error) {
	return s.workspaceRepo.FindByUserID(userID)
}

func (s *WorkspaceService) Update(workspaceID uuid.UUID, userID uuid.UUID, req models.UpdateWorkspaceRequest) (*models.Workspace, error) {
	workspace, err := s.workspaceRepo.FindByID(workspaceID)
	if err != nil {
		return nil, errors.New("workspace not found")
	}

	if !s.workspaceRepo.IsOwner(workspaceID, userID) {
		return nil, errors.New("only owner can update workspace")
	}

	if req.Name != "" {
		workspace.Name = req.Name
	}
	if req.Description != "" {
		workspace.Description = req.Description
	}

	if err := s.workspaceRepo.Update(workspace); err != nil {
		return nil, err
	}

	return workspace, nil
}

func (s *WorkspaceService) Delete(workspaceID uuid.UUID, userID uuid.UUID) error {
	if !s.workspaceRepo.IsOwner(workspaceID, userID) {
		return errors.New("only owner can delete workspace")
	}

	return s.workspaceRepo.Delete(workspaceID)
}

func (s *WorkspaceService) AddMember(workspaceID uuid.UUID, userID uuid.UUID, memberUserID uuid.UUID, role string) error {
	if !s.workspaceRepo.IsOwner(workspaceID, userID) {
		return errors.New("only owner can add members")
	}

	if role == "" {
		role = "member"
	}

	member := &models.WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      memberUserID,
		Role:        role,
	}

	return s.workspaceRepo.AddMember(member)
}

func (s *WorkspaceService) AddMemberByEmail(workspaceID uuid.UUID, userID uuid.UUID, email string, role string) error {
	if !s.workspaceRepo.IsOwner(workspaceID, userID) {
		return errors.New("only owner can add members")
	}

	// Find user by email
	userRepo := repository.NewUserRepository()
	memberUser, err := userRepo.FindByEmail(email)
	if err != nil {
		return errors.New("user not found with this email")
	}

	if role == "" {
		role = "member"
	}

	// Check if already a member
	if s.workspaceRepo.IsMember(workspaceID, memberUser.ID) {
		return errors.New("user is already a member")
	}

	member := &models.WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      memberUser.ID,
		Role:        role,
	}

	return s.workspaceRepo.AddMember(member)
}

func (s *WorkspaceService) RemoveMember(workspaceID uuid.UUID, userID uuid.UUID, memberUserID uuid.UUID) error {
	if !s.workspaceRepo.IsOwner(workspaceID, userID) && userID != memberUserID {
		return errors.New("only owner can remove members")
	}

	return s.workspaceRepo.RemoveMember(workspaceID, memberUserID)
}

func (s *WorkspaceService) GetMembers(workspaceID uuid.UUID, userID uuid.UUID) ([]models.WorkspaceMember, error) {
	if !s.hasAccess(workspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return s.workspaceRepo.GetMembers(workspaceID)
}

func (s *WorkspaceService) hasAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}
