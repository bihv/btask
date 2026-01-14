package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type CustomFieldService struct {
	customFieldRepo *repository.CustomFieldRepository
	workspaceRepo   *repository.WorkspaceRepository
	boardRepo       *repository.BoardRepository
	cardRepo        *repository.CardRepository
}

func NewCustomFieldService() *CustomFieldService {
	return &CustomFieldService{
		customFieldRepo: repository.NewCustomFieldRepository(),
		workspaceRepo:   repository.NewWorkspaceRepository(),
		boardRepo:       repository.NewBoardRepository(),
		cardRepo:        repository.NewCardRepository(),
	}
}

// hasWorkspaceAccess checks if user has access to the workspace
func (s *CustomFieldService) hasWorkspaceAccess(workspaceID uuid.UUID, userID uuid.UUID) bool {
	return s.workspaceRepo.IsOwner(workspaceID, userID) || s.workspaceRepo.IsMember(workspaceID, userID)
}

// hasBoardAccess checks if user has access to the board
func (s *CustomFieldService) hasBoardAccess(boardID uuid.UUID, userID uuid.UUID) error {
	board, err := s.boardRepo.FindByID(boardID)
	if err != nil {
		return errors.New("board not found")
	}
	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}
	return nil
}

// Create creates a new custom field for a board
func (s *CustomFieldService) Create(boardID, userID uuid.UUID, req models.CreateCustomFieldRequest) (*models.CustomField, error) {
	if err := s.hasBoardAccess(boardID, userID); err != nil {
		return nil, err
	}

	// Check if field with same name already exists
	if s.customFieldRepo.ExistsByNameAndBoard(req.Name, boardID) {
		return nil, errors.New("custom field with this name already exists")
	}

	maxPos := s.customFieldRepo.GetMaxPosition(boardID)

	field := &models.CustomField{
		BoardID:    boardID,
		Name:       req.Name,
		Type:       models.CustomFieldType(req.Type),
		Position:   maxPos + 1,
		ShowOnCard: req.ShowOnCard,
		IsDefault:  false,
	}

	if err := s.customFieldRepo.Create(field); err != nil {
		return nil, err
	}

	// Create options for dropdown type
	if req.Type == "dropdown" && len(req.Options) > 0 {
		for i, optValue := range req.Options {
			option := &models.CustomFieldOption{
				CustomFieldID: field.ID,
				Value:         optValue,
				Position:      i,
			}
			s.customFieldRepo.CreateOption(option)
		}
	}

	// Fetch with options
	return s.customFieldRepo.FindByID(field.ID)
}

// GetByBoardID returns all custom fields for a board
func (s *CustomFieldService) GetByBoardID(boardID, userID uuid.UUID) ([]models.CustomField, error) {
	if err := s.hasBoardAccess(boardID, userID); err != nil {
		return nil, err
	}

	return s.customFieldRepo.FindByBoardID(boardID)
}

// Update updates a custom field
func (s *CustomFieldService) Update(fieldID, userID uuid.UUID, req models.UpdateCustomFieldRequest) (*models.CustomField, error) {
	field, err := s.customFieldRepo.FindByID(fieldID)
	if err != nil {
		return nil, errors.New("custom field not found")
	}

	if err := s.hasBoardAccess(field.BoardID, userID); err != nil {
		return nil, err
	}

	if req.Name != "" {
		field.Name = req.Name
	}
	if req.ShowOnCard != nil {
		field.ShowOnCard = *req.ShowOnCard
	}
	if req.Position != nil {
		field.Position = *req.Position
	}

	if err := s.customFieldRepo.Update(field); err != nil {
		return nil, err
	}

	return s.customFieldRepo.FindByID(fieldID)
}

// Delete deletes a custom field
func (s *CustomFieldService) Delete(fieldID, userID uuid.UUID) error {
	field, err := s.customFieldRepo.FindByID(fieldID)
	if err != nil {
		return errors.New("custom field not found")
	}

	if err := s.hasBoardAccess(field.BoardID, userID); err != nil {
		return err
	}

	return s.customFieldRepo.Delete(fieldID)
}

// AddDefaultField adds a predefined default field to a board
func (s *CustomFieldService) AddDefaultField(boardID, userID uuid.UUID, fieldName string) (*models.CustomField, error) {
	if err := s.hasBoardAccess(boardID, userID); err != nil {
		return nil, err
	}

	defaultField, exists := models.DefaultCustomFields[fieldName]
	if !exists {
		return nil, errors.New("invalid default field name")
	}

	// Check if field with same name already exists
	if s.customFieldRepo.ExistsByNameAndBoard(defaultField.Name, boardID) {
		return nil, errors.New("this field already exists on the board")
	}

	maxPos := s.customFieldRepo.GetMaxPosition(boardID)

	field := &models.CustomField{
		BoardID:    boardID,
		Name:       defaultField.Name,
		Type:       defaultField.Type,
		Position:   maxPos + 1,
		ShowOnCard: true,
		IsDefault:  true,
	}

	if err := s.customFieldRepo.Create(field); err != nil {
		return nil, err
	}

	// Create default options
	for i, opt := range defaultField.Options {
		option := &models.CustomFieldOption{
			CustomFieldID: field.ID,
			Value:         opt.Value,
			Color:         opt.Color,
			Position:      i,
		}
		s.customFieldRepo.CreateOption(option)
	}

	return s.customFieldRepo.FindByID(field.ID)
}

// AddOption adds an option to a dropdown field
func (s *CustomFieldService) AddOption(fieldID, userID uuid.UUID, req models.AddCustomFieldOptionRequest) (*models.CustomFieldOption, error) {
	field, err := s.customFieldRepo.FindByID(fieldID)
	if err != nil {
		return nil, errors.New("custom field not found")
	}

	if err := s.hasBoardAccess(field.BoardID, userID); err != nil {
		return nil, err
	}

	if field.Type != models.CustomFieldTypeDropdown {
		return nil, errors.New("options can only be added to dropdown fields")
	}

	maxPos := s.customFieldRepo.GetOptionMaxPosition(fieldID)

	option := &models.CustomFieldOption{
		CustomFieldID: fieldID,
		Value:         req.Value,
		Color:         req.Color,
		Position:      maxPos + 1,
	}

	if err := s.customFieldRepo.CreateOption(option); err != nil {
		return nil, err
	}

	return s.customFieldRepo.FindOptionByID(option.ID)
}

// UpdateOption updates an option
func (s *CustomFieldService) UpdateOption(optionID, userID uuid.UUID, req models.AddCustomFieldOptionRequest) (*models.CustomFieldOption, error) {
	option, err := s.customFieldRepo.FindOptionByID(optionID)
	if err != nil {
		return nil, errors.New("option not found")
	}

	boardID, err := s.customFieldRepo.GetBoardIDByOptionID(optionID)
	if err != nil {
		return nil, err
	}

	if err := s.hasBoardAccess(boardID, userID); err != nil {
		return nil, err
	}

	option.Value = req.Value
	if req.Color != "" {
		option.Color = req.Color
	}

	if err := s.customFieldRepo.UpdateOption(option); err != nil {
		return nil, err
	}

	return option, nil
}

// DeleteOption deletes an option
func (s *CustomFieldService) DeleteOption(optionID, userID uuid.UUID) error {
	boardID, err := s.customFieldRepo.GetBoardIDByOptionID(optionID)
	if err != nil {
		return errors.New("option not found")
	}

	if err := s.hasBoardAccess(boardID, userID); err != nil {
		return err
	}

	return s.customFieldRepo.DeleteOption(optionID)
}

// SetCardValue sets a custom field value for a card
func (s *CustomFieldService) SetCardValue(cardID, customFieldID, userID uuid.UUID, req models.SetCardCustomFieldValueRequest) (*models.CardCustomFieldValue, error) {
	// Verify card access
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return nil, errors.New("card not found")
	}

	// Get board through list
	list, err := s.cardRepo.GetListByCardID(cardID)
	if err != nil {
		return nil, err
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return nil, err
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	// Verify custom field belongs to the same board
	field, err := s.customFieldRepo.FindByID(customFieldID)
	if err != nil {
		return nil, errors.New("custom field not found")
	}

	if field.BoardID != board.ID {
		return nil, errors.New("custom field does not belong to this board")
	}

	value := &models.CardCustomFieldValue{
		CardID:        card.ID,
		CustomFieldID: customFieldID,
		Value:         req.Value,
	}

	// Handle dropdown option
	if req.OptionID != "" {
		optID, err := uuid.Parse(req.OptionID)
		if err == nil {
			value.OptionID = &optID
		}
	}

	if err := s.customFieldRepo.SetCardValue(value); err != nil {
		return nil, err
	}

	// Fetch updated values
	values, err := s.customFieldRepo.GetCardValues(cardID)
	if err != nil {
		return nil, err
	}

	for _, v := range values {
		if v.CustomFieldID == customFieldID {
			return &v, nil
		}
	}

	return value, nil
}

// GetCardValues gets all custom field values for a card
func (s *CustomFieldService) GetCardValues(cardID, userID uuid.UUID) ([]models.CardCustomFieldValue, error) {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return nil, errors.New("card not found")
	}

	list, err := s.cardRepo.GetListByCardID(card.ID)
	if err != nil {
		return nil, err
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return nil, err
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return nil, errors.New("access denied")
	}

	return s.customFieldRepo.GetCardValues(cardID)
}

// ClearCardValue clears a custom field value from a card
func (s *CustomFieldService) ClearCardValue(cardID, customFieldID, userID uuid.UUID) error {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	list, err := s.cardRepo.GetListByCardID(card.ID)
	if err != nil {
		return err
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return err
	}

	if !s.hasWorkspaceAccess(board.WorkspaceID, userID) {
		return errors.New("access denied")
	}

	return s.customFieldRepo.DeleteCardValue(cardID, customFieldID)
}
