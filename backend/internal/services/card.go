package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type CardService struct {
	cardRepo      *repository.CardRepository
	listRepo      *repository.ListRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewCardService() *CardService {
	return &CardService{
		cardRepo:      repository.NewCardRepository(),
		listRepo:      repository.NewListRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *CardService) Create(listID uuid.UUID, userID uuid.UUID, req models.CreateCardRequest) (*models.Card, error) {
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

	position := s.cardRepo.GetMaxPosition(listID) + 1
	if req.Position != nil {
		position = *req.Position
	}

	card := &models.Card{
		ListID:      listID,
		Title:       req.Title,
		Description: req.Description,
		Position:    position,
		DueDate:     req.DueDate,
		CreatedBy:   userID,
	}

	if err := s.cardRepo.Create(card); err != nil {
		return nil, err
	}

	return card, nil
}

func (s *CardService) GetByID(cardID uuid.UUID, userID uuid.UUID) (*models.Card, error) {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return nil, errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return card, nil
}

func (s *CardService) Update(cardID uuid.UUID, userID uuid.UUID, req models.UpdateCardRequest) (*models.Card, error) {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return nil, errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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
		card.Title = req.Title
	}
	if req.Description != "" {
		card.Description = req.Description
	}
	if req.Position != nil {
		card.Position = *req.Position
	}
	if req.DueDate != nil {
		card.DueDate = req.DueDate
	}
	if req.IsCompleted != nil {
		card.IsCompleted = *req.IsCompleted
	}
	if req.CoverImage != nil {
		card.CoverImage = *req.CoverImage
	}
	if req.CoverImageY != nil {
		card.CoverImageY = *req.CoverImageY
	}
	if req.IsArchived != nil {
		card.IsArchived = *req.IsArchived
	}

	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}

	return card, nil
}

func (s *CardService) Delete(cardID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.Delete(cardID)
}

func (s *CardService) Move(cardID uuid.UUID, userID uuid.UUID, req models.MoveCardRequest) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.MoveCard(cardID, req.ListID, req.Position)
}

func (s *CardService) AddLabel(cardID uuid.UUID, labelID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.AddLabel(cardID, labelID)
}

func (s *CardService) RemoveLabel(cardID uuid.UUID, labelID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.RemoveLabel(cardID, labelID)
}

func (s *CardService) AddMember(cardID uuid.UUID, memberUserID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.AddMember(cardID, memberUserID)
}

func (s *CardService) RemoveMember(cardID uuid.UUID, memberUserID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.RemoveMember(cardID, memberUserID)
}

func (s *CardService) Archive(cardID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.Archive(cardID)
}

func (s *CardService) Unarchive(cardID uuid.UUID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.listRepo.FindByID(card.ListID)
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

	return s.cardRepo.Unarchive(cardID)
}

func (s *CardService) GetArchivedByBoardID(boardID uuid.UUID, userID uuid.UUID) ([]models.Card, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return s.cardRepo.FindArchivedByBoardID(boardID)
}

func (s *CardService) hasAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}

// GetByAssignedUserID returns all cards assigned to a user with optional filters
func (s *CardService) GetByAssignedUserID(userID uuid.UUID, filter models.CardFilterRequest) ([]models.Card, error) {
	return s.cardRepo.FindByAssignedUserID(userID, filter)
}
