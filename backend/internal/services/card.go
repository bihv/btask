package services

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type CardService struct {
	cardRepo           *repository.CardRepository
	listRepo           *repository.ListRepository
	boardRepo          *repository.BoardRepository
	workspaceRepo      *repository.WorkspaceRepository
	linkPreviewService *LinkPreviewService
	automationService  *AutomationService
}

func NewCardService(automationService *AutomationService) *CardService {
	return &CardService{
		cardRepo:           repository.NewCardRepository(),
		listRepo:           repository.NewListRepository(),
		boardRepo:          repository.NewBoardRepository(),
		workspaceRepo:      repository.NewWorkspaceRepository(),
		linkPreviewService: NewLinkPreviewService(),
		automationService:  automationService,
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
		StartDate:   req.StartDate,
		CreatedBy:   userID,
	}

	// Check if title is a URL and fetch link preview
	if s.linkPreviewService.IsURL(req.Title) {
		preview, err := s.linkPreviewService.FetchPreview(req.Title)
		if err == nil && preview != nil {
			card.LinkURL = preview.URL
			card.LinkTitle = preview.Title
			card.LinkDescription = preview.Description
			card.LinkImage = preview.Image
			card.LinkSiteName = preview.SiteName
			card.LinkFavicon = preview.Favicon
		} else {
			log.Printf("Failed to fetch link preview for %s: %v", req.Title, err)
		}
	}

	if err := s.cardRepo.Create(card); err != nil {
		return nil, err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.created", list.BoardID, map[string]interface{}{
		"card_id":   card.ID.String(),
		"list_id":   listID.String(),
		"board_id":  list.BoardID.String(),
		"list_name": list.Title, // Changed from Name to Title
		"user_id":   userID.String(),
	})

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

	// Track changes for automation triggers
	oldDueDate := card.DueDate
	oldIsCompleted := card.IsCompleted

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
	if req.StartDate != nil {
		card.StartDate = req.StartDate
	}
	if req.IsCompleted != nil {
		card.IsCompleted = *req.IsCompleted
	}
	if req.CoverImage != nil {
		card.CoverImage = *req.CoverImage
	}

	if req.CoverBgColor != nil {
		card.CoverBgColor = *req.CoverBgColor
	}
	if req.IsArchived != nil {
		card.IsArchived = *req.IsArchived
	}

	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}

	// Trigger Automation for due date change
	dueDateChanged := (oldDueDate == nil && card.DueDate != nil) ||
		(oldDueDate != nil && card.DueDate == nil) ||
		(oldDueDate != nil && card.DueDate != nil && !oldDueDate.Equal(*card.DueDate))
	if dueDateChanged {
		s.automationService.ProcessEvent("card.due_date_changed", list.BoardID, map[string]interface{}{
			"card_id":  cardID.String(),
			"list_id":  card.ListID.String(),
			"board_id": list.BoardID.String(),
			"user_id":  userID.String(),
		})
	}

	// Trigger Automation for completion status change
	if oldIsCompleted != card.IsCompleted {
		eventType := "card.completed"
		if !card.IsCompleted {
			eventType = "card.incomplete"
		}
		s.automationService.ProcessEvent(eventType, list.BoardID, map[string]interface{}{
			"card_id":      cardID.String(),
			"list_id":      card.ListID.String(),
			"board_id":     list.BoardID.String(),
			"is_completed": card.IsCompleted,
			"user_id":      userID.String(),
		})
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

	err = s.cardRepo.MoveCard(cardID, req.ListID, req.Position)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.moved", list.BoardID, map[string]interface{}{
		"card_id":     cardID.String(),
		"old_list_id": list.ID.String(),    // Source list (matches trigger config)
		"list_id":     req.ListID.String(), // Target list
		"board_id":    list.BoardID.String(),
		"user_id":     userID.String(),
	})

	return nil
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

	err = s.cardRepo.AddLabel(cardID, labelID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.label_added", list.BoardID, map[string]interface{}{
		"card_id":  cardID.String(),
		"label_id": labelID.String(),
		"board_id": list.BoardID.String(),
		"user_id":  userID.String(),
	})

	return nil
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

	err = s.cardRepo.RemoveLabel(cardID, labelID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.label_removed", list.BoardID, map[string]interface{}{
		"card_id":  cardID.String(),
		"label_id": labelID.String(),
		"board_id": list.BoardID.String(),
		"user_id":  userID.String(),
	})

	return nil
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

	err = s.cardRepo.AddMember(cardID, memberUserID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.member_added", list.BoardID, map[string]interface{}{
		"card_id":   cardID.String(),
		"member_id": memberUserID.String(),
		"board_id":  list.BoardID.String(),
		"user_id":   userID.String(),
	})

	return nil
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

	err = s.cardRepo.RemoveMember(cardID, memberUserID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.member_removed", list.BoardID, map[string]interface{}{
		"card_id":   cardID.String(),
		"member_id": memberUserID.String(),
		"board_id":  list.BoardID.String(),
		"user_id":   userID.String(),
	})

	return nil
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

	err = s.cardRepo.Archive(cardID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.archived", list.BoardID, map[string]interface{}{
		"card_id":  cardID.String(),
		"list_id":  card.ListID.String(),
		"board_id": list.BoardID.String(),
		"user_id":  userID.String(),
	})

	return nil
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

	err = s.cardRepo.Unarchive(cardID)
	if err != nil {
		return err
	}

	// Trigger Automation
	s.automationService.ProcessEvent("card.unarchived", list.BoardID, map[string]interface{}{
		"card_id":  cardID.String(),
		"list_id":  card.ListID.String(),
		"board_id": list.BoardID.String(),
		"user_id":  userID.String(),
	})

	return nil
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

// RefreshLinkPreview refreshes the link preview for a card that has a URL as title
func (s *CardService) RefreshLinkPreview(cardID uuid.UUID, userID uuid.UUID) (*models.Card, error) {
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

	// Try to fetch link preview from title or existing link_url
	urlToFetch := ""
	if s.linkPreviewService.IsURL(card.Title) {
		urlToFetch = card.Title
	}

	if urlToFetch == "" {
		return nil, errors.New("card title is not a URL")
	}

	preview, err := s.linkPreviewService.FetchPreview(urlToFetch)
	if err != nil {
		return nil, errors.New("failed to fetch link preview: " + err.Error())
	}

	card.LinkURL = preview.URL
	card.LinkTitle = preview.Title
	card.LinkDescription = preview.Description
	card.LinkImage = preview.Image
	card.LinkSiteName = preview.SiteName
	card.LinkFavicon = preview.Favicon

	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}

	return card, nil
}

// ClearLinkPreview clears the link preview data for a card
func (s *CardService) ClearLinkPreview(cardID uuid.UUID, userID uuid.UUID) (*models.Card, error) {
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

	// Clear all link preview data
	card.LinkURL = ""
	card.LinkTitle = ""
	card.LinkDescription = ""
	card.LinkImage = ""
	card.LinkSiteName = ""
	card.LinkFavicon = ""

	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}

	return card, nil
}
