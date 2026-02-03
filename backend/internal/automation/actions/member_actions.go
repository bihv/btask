package actions

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/repository"
)

// ============================================================================
// ADD MEMBER ACTION
// ============================================================================

// AddMemberAction assigns a member to a card.
type AddMemberAction struct {
	cardRepo *repository.CardRepository
}

// NewAddMemberAction creates a new AddMemberAction.
func NewAddMemberAction(cardRepo *repository.CardRepository) *AddMemberAction {
	return &AddMemberAction{cardRepo: cardRepo}
}

func (a *AddMemberAction) ID() string {
	return "add_member"
}

func (a *AddMemberAction) Name() string {
	return "Assign member"
}

func (a *AddMemberAction) Description() string {
	return "Assign a member to the card"
}

func (a *AddMemberAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"user_id": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Member",
				Description: "The member to assign to the card",
				UIWidget:    UIWidgetUserPicker,
			},
		},
		Order: []string{"user_id"},
	}
}

func (a *AddMemberAction) SentenceTemplate() string {
	return "assign {user_id} to the card"
}

func (a *AddMemberAction) Validate(config map[string]interface{}) error {
	userID, ok := config["user_id"].(string)
	if !ok || userID == "" {
		return errors.New("user_id is required")
	}
	if _, err := uuid.Parse(userID); err != nil {
		return errors.New("user_id must be a valid UUID")
	}
	return nil
}

func (a *AddMemberAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	userIDStr, ok := ctx.Config["user_id"].(string)
	if !ok || userIDStr == "" {
		return NewErrorResult(errors.New("user_id missing in action config"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid user_id: %v", err))
	}

	if err := a.cardRepo.AddMember(ctx.CardID, userID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to assign member: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Member %s assigned to card", userID),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"user_id": userID.String(),
		},
	}
}

func (a *AddMemberAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryMember,
		Icon:                 "user-plus",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}

// ============================================================================
// REMOVE MEMBER ACTION
// ============================================================================

// RemoveMemberAction removes a member from a card.
type RemoveMemberAction struct {
	cardRepo *repository.CardRepository
}

// NewRemoveMemberAction creates a new RemoveMemberAction.
func NewRemoveMemberAction(cardRepo *repository.CardRepository) *RemoveMemberAction {
	return &RemoveMemberAction{cardRepo: cardRepo}
}

func (a *RemoveMemberAction) ID() string {
	return "remove_member"
}

func (a *RemoveMemberAction) Name() string {
	return "Unassign member"
}

func (a *RemoveMemberAction) Description() string {
	return "Remove a member from the card"
}

func (a *RemoveMemberAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"user_id": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Member",
				Description: "The member to remove from the card",
				UIWidget:    UIWidgetUserPicker,
			},
		},
		Order: []string{"user_id"},
	}
}

func (a *RemoveMemberAction) SentenceTemplate() string {
	return "remove {user_id} from the card"
}

func (a *RemoveMemberAction) Validate(config map[string]interface{}) error {
	userID, ok := config["user_id"].(string)
	if !ok || userID == "" {
		return errors.New("user_id is required")
	}
	if _, err := uuid.Parse(userID); err != nil {
		return errors.New("user_id must be a valid UUID")
	}
	return nil
}

func (a *RemoveMemberAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	userIDStr, ok := ctx.Config["user_id"].(string)
	if !ok || userIDStr == "" {
		return NewErrorResult(errors.New("user_id missing in action config"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid user_id: %v", err))
	}

	if err := a.cardRepo.RemoveMember(ctx.CardID, userID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to remove member: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Member %s removed from card", userID),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"user_id": userID.String(),
		},
	}
}

func (a *RemoveMemberAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryMember,
		Icon:                 "user-minus",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}
