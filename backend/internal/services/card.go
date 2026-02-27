package services

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/events"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type CardService struct {
	cardRepo           *repository.CardRepository
	listRepo           *repository.ListRepository
	boardRepo          *repository.BoardRepository
	workspaceRepo      *repository.WorkspaceRepository
	linkPreviewService *LinkPreviewService
	eventBus           *events.EventBus
}

func NewCardService(eventBus *events.EventBus) *CardService {
	return &CardService{
		cardRepo:           repository.NewCardRepository(),
		listRepo:           repository.NewListRepository(),
		boardRepo:          repository.NewBoardRepository(),
		workspaceRepo:      repository.NewWorkspaceRepository(),
		linkPreviewService: NewLinkPreviewService(),
		eventBus:           eventBus,
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

	// Emit domain event (decoupled from automation)
	s.eventBus.Publish(events.CardCreatedEvent{
		CardID:   card.ID,
		ListID:   listID,
		BoardID:  list.BoardID,
		ListName: list.Title,
		UserID:   userID,
		Context:  events.NewUserContext(),
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

	// Emit domain events for field changes
	dueDateChanged := (oldDueDate == nil && card.DueDate != nil) ||
		(oldDueDate != nil && card.DueDate == nil) ||
		(oldDueDate != nil && card.DueDate != nil && !oldDueDate.Equal(*card.DueDate))
	if dueDateChanged {
		s.eventBus.Publish(events.CardDueDateChangedEvent{
			CardID:  cardID,
			ListID:  card.ListID,
			BoardID: list.BoardID,
			UserID:  userID,
			Context: events.NewUserContext(),
		})
	}

	if oldIsCompleted != card.IsCompleted {
		s.eventBus.Publish(events.CardCompletedEvent{
			CardID:      cardID,
			ListID:      card.ListID,
			BoardID:     list.BoardID,
			IsCompleted: card.IsCompleted,
			UserID:      userID,
			Context:     events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardMovedEvent{
		CardID:    cardID,
		OldListID: list.ID,
		NewListID: req.ListID,
		BoardID:   list.BoardID,
		UserID:    userID,
		Context:   events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardLabelAddedEvent{
		CardID:  cardID,
		LabelID: labelID,
		BoardID: list.BoardID,
		UserID:  userID,
		Context: events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardLabelRemovedEvent{
		CardID:  cardID,
		LabelID: labelID,
		BoardID: list.BoardID,
		UserID:  userID,
		Context: events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardMemberAddedEvent{
		CardID:   cardID,
		MemberID: memberUserID,
		BoardID:  list.BoardID,
		UserID:   userID,
		Context:  events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardMemberRemovedEvent{
		CardID:   cardID,
		MemberID: memberUserID,
		BoardID:  list.BoardID,
		UserID:   userID,
		Context:  events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardArchivedEvent{
		CardID:  cardID,
		ListID:  card.ListID,
		BoardID: list.BoardID,
		UserID:  userID,
		Context: events.NewUserContext(),
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

	// Emit domain event
	s.eventBus.Publish(events.CardUnarchivedEvent{
		CardID:  cardID,
		ListID:  card.ListID,
		BoardID: list.BoardID,
		UserID:  userID,
		Context: events.NewUserContext(),
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
