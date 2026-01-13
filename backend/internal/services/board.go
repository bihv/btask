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
	listRepo      *repository.ListRepository
	cardRepo      *repository.CardRepository
	labelRepo     *repository.LabelRepository
}

func NewBoardService() *BoardService {
	return &BoardService{
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
		listRepo:      repository.NewListRepository(),
		cardRepo:      repository.NewCardRepository(),
		labelRepo:     repository.NewLabelRepository(),
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

// Copy creates a copy of a board with all its lists, cards, and labels
func (s *BoardService) Copy(boardID uuid.UUID, userID uuid.UUID, req models.CopyBoardRequest) (*models.Board, error) {
	// Get source board with lists and cards
	sourceBoard, err := s.boardRepo.FindByIDWithDetails(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(sourceBoard.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	// Determine target workspace
	targetWorkspaceID := sourceBoard.WorkspaceID
	if req.WorkspaceID != "" {
		wsID, err := uuid.Parse(req.WorkspaceID)
		if err == nil {
			if s.hasWorkspaceAccess(wsID, userID) {
				targetWorkspaceID = wsID
			}
		}
	}

	// Create new board
	maxPos := s.boardRepo.GetMaxPosition(targetWorkspaceID)
	newBoard := &models.Board{
		WorkspaceID:     targetWorkspaceID,
		Title:           req.Title,
		Description:     sourceBoard.Description,
		BackgroundColor: sourceBoard.BackgroundColor,
		BackgroundImage: sourceBoard.BackgroundImage,
		ShowCardCovers:  sourceBoard.ShowCardCovers,
		Position:        maxPos + 1,
	}

	if err := s.boardRepo.Create(newBoard); err != nil {
		return nil, err
	}

	// Copy labels and create mapping from old to new
	labelMapping := make(map[uuid.UUID]uuid.UUID)
	for _, label := range sourceBoard.Labels {
		newLabel := &models.Label{
			BoardID: newBoard.ID,
			Name:    label.Name,
			Color:   label.Color,
		}
		if err := s.labelRepo.Create(newLabel); err == nil {
			labelMapping[label.ID] = newLabel.ID
		}
	}

	// Copy lists with cards
	for _, list := range sourceBoard.Lists {
		if list.IsArchived {
			continue // Skip archived lists
		}

		newList := &models.List{
			BoardID:     newBoard.ID,
			Title:       list.Title,
			Position:    list.Position,
			Color:       list.Color,
			IsCollapsed: list.IsCollapsed,
		}

		if err := s.listRepo.Create(newList); err != nil {
			continue
		}

		// Copy cards in the list
		for _, card := range list.Cards {
			if card.IsArchived {
				continue // Skip archived cards
			}

			newCard := &models.Card{
				ListID:      newList.ID,
				Title:       card.Title,
				Description: card.Description,
				Position:    card.Position,
				CoverImage:  card.CoverImage,
				DueDate:     card.DueDate,
				CreatedBy:   userID,
			}

			if err := s.cardRepo.Create(newCard); err != nil {
				continue
			}

			// Copy card labels
			for _, cardLabel := range card.Labels {
				if newLabelID, ok := labelMapping[cardLabel.LabelID]; ok {
					s.cardRepo.AddLabel(newCard.ID, newLabelID)
				}
			}
		}
	}

	return newBoard, nil
}

func (s *BoardService) hasWorkspaceAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}

func (s *BoardService) Watch(boardID uuid.UUID, userID uuid.UUID) error {
	return s.boardRepo.AddWatcher(boardID, userID)
}

func (s *BoardService) Unwatch(boardID uuid.UUID, userID uuid.UUID) error {
	return s.boardRepo.RemoveWatcher(boardID, userID)
}

func (s *BoardService) IsWatching(boardID uuid.UUID, userID uuid.UUID) bool {
	return s.boardRepo.IsWatching(boardID, userID)
}
