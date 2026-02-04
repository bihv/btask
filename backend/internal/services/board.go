package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
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
		BackgroundImage: req.BackgroundImage,
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

// RecordBoardView records that a user viewed a board
func (s *BoardService) RecordBoardView(boardID uuid.UUID, userID uuid.UUID) error {
	return s.boardRepo.RecordView(boardID, userID)
}

// GetRecentlyViewed returns recently viewed boards for a user
func (s *BoardService) GetRecentlyViewed(userID uuid.UUID, limit int) ([]models.Board, error) {
	if limit <= 0 {
		limit = 4
	}
	return s.boardRepo.GetRecentlyViewed(userID, limit)
}

// GetMembers returns all members of a board (workspace members + board-specific members)
func (s *BoardService) GetMembers(boardID uuid.UUID, userID uuid.UUID) ([]models.BoardMember, error) {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return nil, errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	// Get workspace members
	workspaceMembers, err := s.workspaceRepo.GetMembers(board.WorkspaceID)
	if err != nil {
		return nil, err
	}

	// Get board-specific members
	boardMembers, err := s.boardRepo.GetMembers(boardID)
	if err != nil {
		return nil, err
	}

	// Create a map to track unique members by user ID
	memberMap := make(map[uuid.UUID]models.BoardMember)

	// Add workspace members first (they get access via workspace)
	for _, wm := range workspaceMembers {
		memberMap[wm.UserID] = models.BoardMember{
			ID:        wm.ID,
			BoardID:   boardID,
			UserID:    wm.UserID,
			Role:      wm.Role, // Keep workspace role
			CreatedAt: wm.CreatedAt,
			User:      wm.User,
		}
	}

	// Override with board-specific members (they may have different role)
	for _, bm := range boardMembers {
		memberMap[bm.UserID] = bm
	}

	// Convert map to slice
	result := make([]models.BoardMember, 0, len(memberMap))
	for _, member := range memberMap {
		result = append(result, member)
	}

	return result, nil
}

// AddMemberByEmail adds a member to a board by email
func (s *BoardService) AddMemberByEmail(boardID uuid.UUID, inviterID uuid.UUID, email string, role string) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, inviterID) {
		return errors.New("access denied")
	}

	// Find user by email
	userRepo := repository.NewUserRepository()
	user, err := userRepo.FindByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Check if already a workspace member (they already have access)
	if s.workspaceRepo.IsMember(board.WorkspaceID, user.ID) {
		return errors.New("user already has access via workspace membership")
	}

	// Check if already a board-specific member
	if s.boardRepo.IsMember(boardID, user.ID) {
		return errors.New("user is already a board member")
	}

	if role == "" {
		role = "member"
	}

	member := &models.BoardMember{
		BoardID: boardID,
		UserID:  user.ID,
		Role:    role,
	}

	return s.boardRepo.AddMember(member)
}

// RemoveMember removes a board-specific member (cannot remove workspace members from board)
func (s *BoardService) RemoveMember(boardID uuid.UUID, removerID uuid.UUID, memberUserID uuid.UUID) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, removerID) {
		return errors.New("access denied")
	}

	// Check if this is a workspace member - cannot remove them from board level
	if s.workspaceRepo.IsMember(board.WorkspaceID, memberUserID) {
		return errors.New("cannot remove workspace member from board - remove from workspace instead")
	}

	// Check if actually a board member
	if !s.boardRepo.IsMember(boardID, memberUserID) {
		return errors.New("user is not a board member")
	}

	return s.boardRepo.RemoveMember(boardID, memberUserID)
}
