package services

import (
	"errors"

	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/repository"
	"github.com/google/uuid"
)

type BoardService struct {
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewBoardService() *BoardService {
	return &BoardService{
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *BoardService) Create(workspaceID uuid.UUID, userID uuid.UUID, req models.CreateBoardRequest) (*models.Board, error) {
	if !s.hasWorkspaceAccess(workspaceID, userID) {
		return nil, errors.New("access denied")
	}

	maxPos := s.boardRepo.GetMaxPosition(workspaceID)

	board := &models.Board{
		WorkspaceID:     workspaceID,
		Title:           req.Title,
		Description:     req.Description,
		BackgroundColor: req.BackgroundColor,
		Position:        maxPos + 1,
	}

	if board.BackgroundColor == "" {
		board.BackgroundColor = "#0079bf"
	}

	if err := s.boardRepo.Create(board); err != nil {
		return nil, err
	}

	return board, nil
}

func (s *BoardService) GetByID(boardID uuid.UUID, userID uuid.UUID) (*models.Board, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return board, nil
}

func (s *BoardService) GetByWorkspaceID(workspaceID uuid.UUID, userID uuid.UUID) ([]models.Board, error) {
	if !s.hasWorkspaceAccess(workspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return s.boardRepo.FindByWorkspaceID(workspaceID)
}

func (s *BoardService) Update(boardID uuid.UUID, userID uuid.UUID, req models.UpdateBoardRequest) (*models.Board, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	if req.Title != "" {
		board.Title = req.Title
	}
	if req.Description != "" {
		board.Description = req.Description
	}
	if req.BackgroundColor != "" {
		board.BackgroundColor = req.BackgroundColor
	}
	if req.BackgroundImage != "" {
		board.BackgroundImage = req.BackgroundImage
	}
	if req.IsStarred != nil {
		board.IsStarred = *req.IsStarred
	}
	if req.Position != nil {
		board.Position = *req.Position
	}
	if req.ShowCardCovers != nil {
		board.ShowCardCovers = *req.ShowCardCovers
	}

	if err := s.boardRepo.Update(board); err != nil {
		return nil, err
	}

	return board, nil
}

func (s *BoardService) Delete(boardID uuid.UUID, userID uuid.UUID) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.boardRepo.Delete(boardID)
}

func (s *BoardService) hasWorkspaceAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}
