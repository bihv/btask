package actions

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/repository"
)

// MoveCardAction moves a card to a specified list.
// It implements the ActionExecutor interface.
type MoveCardAction struct {
	cardRepo *repository.CardRepository
}

// NewMoveCardAction creates a new MoveCardAction with the required repositories.
func NewMoveCardAction(cardRepo *repository.CardRepository) *MoveCardAction {
	return &MoveCardAction{
		cardRepo: cardRepo,
	}
}

// ID returns the unique identifier for this action.
func (a *MoveCardAction) ID() string {
	return "move_card"
}

// Name returns the human-readable name.
func (a *MoveCardAction) Name() string {
	return "Move card"
}

// Description returns a brief description of this action.
func (a *MoveCardAction) Description() string {
	return "Move the card to a different list on the same board"
}

// Schema returns the JSON Schema for this action's configuration.
func (a *MoveCardAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"list_id": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Destination List",
				Description: "The list to move the card to",
				UIWidget:    UIWidgetListPicker,
			},
			"position": {
				Type:        PropertyTypeString,
				Required:    false,
				Label:       "Position",
				Description: "Where to place the card in the list",
				UIWidget:    UIWidgetSelect,
				Options: []SelectOption{
					{Value: "top", Label: "Top of list"},
					{Value: "bottom", Label: "Bottom of list"},
				},
				Default: "bottom",
			},
		},
		Order: []string{"list_id", "position"},
	}
}

// SentenceTemplate returns the sentence template for this action.
func (a *MoveCardAction) SentenceTemplate() string {
	return "move card to {list_id} at the {position}"
}

// Validate checks if the provided config is valid.
func (a *MoveCardAction) Validate(config map[string]interface{}) error {
	listID, ok := config["list_id"].(string)
	if !ok || listID == "" {
		return errors.New("list_id is required")
	}

	if _, err := uuid.Parse(listID); err != nil {
		return errors.New("list_id must be a valid UUID")
	}

	return nil
}

// Execute performs the move card action.
func (a *MoveCardAction) Execute(ctx ActionContext) ActionResult {
	// Get card ID from context
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	// Get target list ID from config
	listIDStr, ok := ctx.Config["list_id"].(string)
	if !ok || listIDStr == "" {
		return NewErrorResult(errors.New("list_id missing in action config"))
	}

	targetListID, err := uuid.Parse(listIDStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid list_id: %v", err))
	}

	// Determine position
	position := "bottom"
	if pos, ok := ctx.Config["position"].(string); ok {
		position = pos
	}

	// Calculate new position
	var newPos int
	if position == "top" {
		newPos = 0
	} else {
		maxPos := a.cardRepo.GetMaxPosition(targetListID)
		newPos = maxPos + 1
	}

	// Execute move
	if err := a.cardRepo.MoveCard(ctx.CardID, targetListID, newPos); err != nil {
		return NewErrorResult(fmt.Errorf("failed to move card: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Card moved to list %s at position %s", targetListID, position),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"new_list_id": targetListID.String(),
			"new_position": newPos,
		},
	}
}

// Metadata returns additional metadata for UI organization.
func (a *MoveCardAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryCard,
		Icon:                 "arrow-right",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}
