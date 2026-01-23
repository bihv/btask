package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type TemplateService struct {
	repo          *repository.TemplateRepository
	boardRepo     *repository.BoardRepository
	listRepo      *repository.ListRepository
	cardRepo      *repository.CardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewTemplateService(repo *repository.TemplateRepository) *TemplateService {
	return &TemplateService{
		repo:          repo,
		boardRepo:     repository.NewBoardRepository(),
		listRepo:      repository.NewListRepository(),
		cardRepo:      repository.NewCardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *TemplateService) Create(req models.CreateTemplateRequest, creatorID uuid.UUID) (*models.Template, error) {
	template := &models.Template{
		Title:           req.Title,
		Author:          req.Author,
		Description:     req.Description,
		FullDescription: req.FullDescription,
		Category:        req.Category,
		CoverColor:      req.CoverColor,
		CoverURL:        req.CoverURL,
		IsFeatured:      req.IsFeatured,
		IsActive:        true,
		CreatedBy:       creatorID,
	}

	if err := s.repo.Create(template); err != nil {
		return nil, err
	}

	// Create lists and cards
	for i, listInput := range req.Lists {
		list := &models.TemplateList{
			TemplateID: template.ID,
			Title:      listInput.Title,
			Color:      listInput.Color,
			Position:   i,
		}
		if err := s.repo.CreateList(list); err != nil {
			return nil, err
		}

		for j, cardInput := range listInput.Cards {
			card := &models.TemplateCard{
				TemplateListID: list.ID,
				Title:          cardInput.Title,
				Description:    cardInput.Description,
				CoverURL:       cardInput.CoverURL,
				DueDate:        cardInput.DueDate,
				Position:       j,
			}
			if err := s.repo.CreateCard(card); err != nil {
				return nil, err
			}
		}
	}

	// Re-fetch with relations
	return s.repo.FindByID(template.ID)
}

func (s *TemplateService) GetByID(id uuid.UUID) (*models.Template, error) {
	return s.repo.FindByID(id)
}

func (s *TemplateService) GetAll(params models.TemplateListParams, isAdmin bool) ([]models.Template, int64, error) {
	return s.repo.FindAll(params, isAdmin)
}

func (s *TemplateService) Update(id uuid.UUID, req models.UpdateTemplateRequest) (*models.Template, error) {
	template, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		template.Title = *req.Title
	}
	if req.Author != nil {
		template.Author = *req.Author
	}
	if req.Description != nil {
		template.Description = *req.Description
	}
	if req.FullDescription != nil {
		template.FullDescription = *req.FullDescription
	}
	if req.Category != nil {
		template.Category = *req.Category
	}
	if req.CoverColor != nil {
		template.CoverColor = *req.CoverColor
	}
	if req.CoverURL != nil {
		template.CoverURL = *req.CoverURL
	}
	if req.IsFeatured != nil {
		template.IsFeatured = *req.IsFeatured
	}
	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}

	if err := s.repo.Update(template); err != nil {
		return nil, err
	}

	return template, nil
}

func (s *TemplateService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}

func (s *TemplateService) IncrementViews(id uuid.UUID) error {
	return s.repo.IncrementViews(id)
}

func (s *TemplateService) IncrementCopies(id uuid.UUID) error {
	return s.repo.IncrementCopies(id)
}

func (s *TemplateService) UpdateLists(templateID uuid.UUID, lists []models.CreateTemplateListInput) error {
	// Delete existing lists and cards (cascade delete)
	if err := s.repo.DeleteListsByTemplateID(templateID); err != nil {
		return err
	}

	// Create new lists and cards
	for i, listInput := range lists {
		list := &models.TemplateList{
			TemplateID: templateID,
			Title:      listInput.Title,
			Color:      listInput.Color,
			Position:   i,
		}
		if err := s.repo.CreateList(list); err != nil {
			return err
		}

		for j, cardInput := range listInput.Cards {
			card := &models.TemplateCard{
				TemplateListID: list.ID,
				Title:          cardInput.Title,
				Description:    cardInput.Description,
				CoverURL:       cardInput.CoverURL,
				DueDate:        cardInput.DueDate,
				Position:       j,
			}
			if err := s.repo.CreateCard(card); err != nil {
				return err
			}
		}
	}

	return nil
}

// UseTemplate creates a new board from a template
func (s *TemplateService) UseTemplate(templateID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID, boardTitle string) (*models.Board, error) {
	// Check workspace access
	_, err := s.workspaceRepo.FindByID(workspaceID)
	if err != nil {
		return nil, errors.New("workspace not found")
	}

	// Verify user has access to workspace
	isOwner := s.workspaceRepo.IsOwner(workspaceID, userID)
	isMember := s.workspaceRepo.IsMember(workspaceID, userID)
	if !isOwner && !isMember {
		return nil, errors.New("access denied to workspace")
	}

	// Fetch template with all relations
	template, err := s.repo.FindByID(templateID)
	if err != nil {
		return nil, errors.New("template not found")
	}

	if !template.IsActive {
		return nil, errors.New("template is not active")
	}

	// Use template title if boardTitle not provided
	if boardTitle == "" {
		boardTitle = template.Title
	}

	// Get max position for board in workspace
	maxPos := s.boardRepo.GetMaxPosition(workspaceID)

	// Create new board from template
	board := &models.Board{
		WorkspaceID:     workspaceID,
		Title:           boardTitle,
		Description:     template.Description,
		BackgroundColor: template.CoverColor,
		Position:        maxPos + 1,
	}

	if board.BackgroundColor == "" {
		board.BackgroundColor = "#0079bf"
	}

	// Create board
	if err := s.boardRepo.Create(board); err != nil {
		return nil, err
	}

	// Clone lists and cards
	for _, templateList := range template.Lists {
		list := &models.List{
			BoardID:  board.ID,
			Title:    templateList.Title,
			Color:    templateList.Color,
			Position: templateList.Position,
		}

		if err := s.listRepo.Create(list); err != nil {
			// Rollback: delete board if list creation fails
			s.boardRepo.Delete(board.ID)
			return nil, err
		}

		// Clone cards for this list
		for _, templateCard := range templateList.Cards {
			card := &models.Card{
				ListID:      list.ID,
				Title:       templateCard.Title,
				Description: templateCard.Description,
				CoverImage:  templateCard.CoverURL,
				DueDate:     templateCard.DueDate,
				Position:    templateCard.Position,
				CreatedBy:   userID,
			}

			if err := s.cardRepo.Create(card); err != nil {
				// Rollback: delete board (cascades to lists and cards)
				s.boardRepo.Delete(board.ID)
				return nil, err
			}
		}
	}

	// Increment template copies counter
	go s.IncrementCopies(templateID)

	// Fetch board with relations for response
	return s.boardRepo.FindByID(board.ID)
}
