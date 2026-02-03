package actions

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/repository"
)

// ============================================================================
// ADD LABEL ACTION
// ============================================================================

// AddLabelAction adds a label to a card.
type AddLabelAction struct {
	cardRepo *repository.CardRepository
}

// NewAddLabelAction creates a new AddLabelAction.
func NewAddLabelAction(cardRepo *repository.CardRepository) *AddLabelAction {
	return &AddLabelAction{cardRepo: cardRepo}
}

func (a *AddLabelAction) ID() string {
	return "add_label"
}

func (a *AddLabelAction) Name() string {
	return "Add label"
}

func (a *AddLabelAction) Description() string {
	return "Add a label to the card"
}

func (a *AddLabelAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"label_id": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Label",
				Description: "The label to add to the card",
				UIWidget:    UIWidgetLabelPicker,
			},
		},
		Order: []string{"label_id"},
	}
}

func (a *AddLabelAction) SentenceTemplate() string {
	return "add label {label_id} to the card"
}

func (a *AddLabelAction) Validate(config map[string]interface{}) error {
	labelID, ok := config["label_id"].(string)
	if !ok || labelID == "" {
		return errors.New("label_id is required")
	}
	if _, err := uuid.Parse(labelID); err != nil {
		return errors.New("label_id must be a valid UUID")
	}
	return nil
}

func (a *AddLabelAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	labelIDStr, ok := ctx.Config["label_id"].(string)
	if !ok || labelIDStr == "" {
		return NewErrorResult(errors.New("label_id missing in action config"))
	}

	labelID, err := uuid.Parse(labelIDStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid label_id: %v", err))
	}

	if err := a.cardRepo.AddLabel(ctx.CardID, labelID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to add label: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Label %s added to card", labelID),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"label_id": labelID.String(),
		},
	}
}

func (a *AddLabelAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryLabel,
		Icon:                 "tag",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}

// ============================================================================
// REMOVE LABEL ACTION
// ============================================================================

// RemoveLabelAction removes a label from a card.
type RemoveLabelAction struct {
	cardRepo *repository.CardRepository
}

// NewRemoveLabelAction creates a new RemoveLabelAction.
func NewRemoveLabelAction(cardRepo *repository.CardRepository) *RemoveLabelAction {
	return &RemoveLabelAction{cardRepo: cardRepo}
}

func (a *RemoveLabelAction) ID() string {
	return "remove_label"
}

func (a *RemoveLabelAction) Name() string {
	return "Remove label"
}

func (a *RemoveLabelAction) Description() string {
	return "Remove a label from the card"
}

func (a *RemoveLabelAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"label_id": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Label",
				Description: "The label to remove from the card",
				UIWidget:    UIWidgetLabelPicker,
			},
		},
		Order: []string{"label_id"},
	}
}

func (a *RemoveLabelAction) SentenceTemplate() string {
	return "remove label {label_id} from the card"
}

func (a *RemoveLabelAction) Validate(config map[string]interface{}) error {
	labelID, ok := config["label_id"].(string)
	if !ok || labelID == "" {
		return errors.New("label_id is required")
	}
	if _, err := uuid.Parse(labelID); err != nil {
		return errors.New("label_id must be a valid UUID")
	}
	return nil
}

func (a *RemoveLabelAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	labelIDStr, ok := ctx.Config["label_id"].(string)
	if !ok || labelIDStr == "" {
		return NewErrorResult(errors.New("label_id missing in action config"))
	}

	labelID, err := uuid.Parse(labelIDStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid label_id: %v", err))
	}

	if err := a.cardRepo.RemoveLabel(ctx.CardID, labelID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to remove label: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Label %s removed from card", labelID),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"label_id": labelID.String(),
		},
	}
}

func (a *RemoveLabelAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryLabel,
		Icon:                 "tag-off",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}
