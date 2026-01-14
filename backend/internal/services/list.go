package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type ListService struct {
	listRepo      *repository.ListRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
	cardRepo      *repository.CardRepository
}

func NewListService() *ListService {
	return &ListService{
		listRepo:      repository.NewListRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
		cardRepo:      repository.NewCardRepository(),
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
	// Only update color if provided (nil means don't change)
	if req.Color != nil {
		list.Color = *req.Color
	}
	// Update collapsed state if provided
	if req.IsCollapsed != nil {
		list.IsCollapsed = *req.IsCollapsed
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

func (s *ListService) Copy(listID uuid.UUID, userID uuid.UUID, title string) (*models.List, error) {
	// Get original list with cards (FindByID already preloads Cards)
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

	// Use provided title or default to "original (copy)"
	newTitle := title
	if newTitle == "" {
		newTitle = list.Title + " (copy)"
	}

	// Create new list at next position
	newPosition := s.listRepo.GetMaxPosition(list.BoardID) + 1
	newList := &models.List{
		BoardID:  list.BoardID,
		Title:    newTitle,
		Position: newPosition,
		Color:    list.Color,
	}

	if err := s.listRepo.Create(newList); err != nil {
		return nil, err
	}

	// Copy all cards
	for i, card := range list.Cards {
		newCard := &models.Card{
			ListID:      newList.ID,
			Title:       card.Title,
			Description: card.Description,
			CoverImage:  card.CoverImage,
			Position:    i,
			DueDate:     card.DueDate,
			CreatedBy:   userID,
		}
		if err := s.cardRepo.Create(newCard); err != nil {
			// Continue even if card copy fails
			continue
		}
		newList.Cards = append(newList.Cards, *newCard)
	}

	return newList, nil
}

func (s *ListService) MoveAllCards(sourceListID uuid.UUID, targetListID uuid.UUID, userID uuid.UUID) error {
	// Get source list
	sourceList, err := s.listRepo.FindByID(sourceListID)
	if err != nil {
		return errors.New("source list not found")
	}

	// Get target list
	targetList, err := s.listRepo.FindByID(targetListID)
	if err != nil {
		return errors.New("target list not found")
	}

	// Check access for source list's board
	sourceBoard, err := s.boardRepo.FindByID(sourceList.BoardID)
	if err != nil {
		return errors.New("board not found")
	}
	if !s.hasAccess(sourceBoard.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	// Get max position in target list
	maxPos := 0
	for _, card := range targetList.Cards {
		if card.Position > maxPos {
			maxPos = card.Position
		}
	}

	// Move all cards from source to target
	for _, card := range sourceList.Cards {
		maxPos++
		card.ListID = targetListID
		card.Position = maxPos
		if err := s.cardRepo.Update(&card); err != nil {
			continue
		}
	}

	return nil
}

func (s *ListService) SortCards(listID uuid.UUID, userID uuid.UUID, sortBy string) error {
	// Get list with cards
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

	// Sort cards based on sortBy parameter
	cards := list.Cards
	switch sortBy {
	case "date_newest":
		// Sort by created_at descending (newest first)
		for i := 0; i < len(cards)-1; i++ {
			for j := i + 1; j < len(cards); j++ {
				if cards[i].CreatedAt.Before(cards[j].CreatedAt) {
					cards[i], cards[j] = cards[j], cards[i]
				}
			}
		}
	case "date_oldest":
		// Sort by created_at ascending (oldest first)
		for i := 0; i < len(cards)-1; i++ {
			for j := i + 1; j < len(cards); j++ {
				if cards[i].CreatedAt.After(cards[j].CreatedAt) {
					cards[i], cards[j] = cards[j], cards[i]
				}
			}
		}
	case "alphabetical":
		// Sort by title alphabetically
		for i := 0; i < len(cards)-1; i++ {
			for j := i + 1; j < len(cards); j++ {
				if cards[i].Title > cards[j].Title {
					cards[i], cards[j] = cards[j], cards[i]
				}
			}
		}
	default:
		return errors.New("invalid sort type")
	}

	// Update positions in database
	for i, card := range cards {
		card.Position = i
		if err := s.cardRepo.Update(&card); err != nil {
			continue
		}
	}

	return nil
}

func (s *ListService) Archive(listID uuid.UUID, userID uuid.UUID) error {
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

	return s.listRepo.Archive(listID)
}

func (s *ListService) Unarchive(listID uuid.UUID, userID uuid.UUID) error {
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

	return s.listRepo.Unarchive(listID)
}

func (s *ListService) ArchiveAllCards(listID uuid.UUID, userID uuid.UUID) error {
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

	return s.listRepo.ArchiveAllCards(listID)
}

func (s *ListService) GetArchivedByBoardID(boardID uuid.UUID, userID uuid.UUID) ([]models.List, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return s.listRepo.FindArchivedByBoardID(boardID)
}

// ExpandAllLists expands all lists in a board
func (s *ListService) ExpandAllLists(boardID uuid.UUID, userID uuid.UUID) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.listRepo.SetAllListsCollapsed(boardID, false)
}

// CollapseAllLists collapses all lists in a board
func (s *ListService) CollapseAllLists(boardID uuid.UUID, userID uuid.UUID) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.listRepo.SetAllListsCollapsed(boardID, true)
}

func (s *ListService) hasAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}
