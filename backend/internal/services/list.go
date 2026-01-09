package services

import (
	"errors"

	"github.com/btask/backend/internal/models"
	"github.com/btask/backend/internal/repository"
	"github.com/google/uuid"
)

type ListService struct {
	listRepo      *repository.ListRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewListService() *ListService {
	return &ListService{
		listRepo:      repository.NewListRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *ListService) Create(boardID uuid.UUID, userID uuid.UUID, req models.CreateListRequest) (*models.List, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	position := s.listRepo.GetMaxPosition(boardID) + 1
	if req.Position != nil {
		position = *req.Position
	}

	list := &models.List{
		BoardID:  boardID,
		Title:    req.Title,
		Position: position,
	}

	if err := s.listRepo.Create(list); err != nil {
		return nil, err
	}

	return list, nil
}

func (s *ListService) GetByID(listID uuid.UUID, userID uuid.UUID) (*models.List, error) {
	list, err := s.listRepo.FindByID(listID)
	if err != nil {
		return nil, errors.New("list not found")
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return list, nil
}

func (s *ListService) Update(listID uuid.UUID, userID uuid.UUID, req models.UpdateListRequest) (*models.List, error) {
	list, err := s.listRepo.FindByID(listID)
	if err != nil {
		return nil, errors.New("list not found")
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	if req.Title != "" {
		list.Title = req.Title
	}
	if req.Position != nil {
		list.Position = *req.Position
	}

	if err := s.listRepo.Update(list); err != nil {
		return nil, err
	}

	return list, nil
}

func (s *ListService) Delete(listID uuid.UUID, userID uuid.UUID) error {
	list, err := s.listRepo.FindByID(listID)
	if err != nil {
		return errors.New("list not found")
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.listRepo.Delete(listID)
}

func (s *ListService) Move(listID uuid.UUID, userID uuid.UUID, req models.MoveListRequest) error {
	list, err := s.listRepo.FindByID(listID)
	if err != nil {
		return errors.New("list not found")
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.listRepo.ReorderLists(list.BoardID, listID, req.Position)
}

func (s *ListService) hasAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}
