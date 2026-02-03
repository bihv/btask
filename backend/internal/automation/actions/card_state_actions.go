package actions

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/repository"
)

// ============================================================================
// ARCHIVE CARD ACTION
// ============================================================================

// ArchiveCardAction archives a card.
type ArchiveCardAction struct {
	cardRepo *repository.CardRepository
}

// NewArchiveCardAction creates a new ArchiveCardAction.
func NewArchiveCardAction(cardRepo *repository.CardRepository) *ArchiveCardAction {
	return &ArchiveCardAction{cardRepo: cardRepo}
}

func (a *ArchiveCardAction) ID() string {
	return "archive_card"
}

func (a *ArchiveCardAction) Name() string {
	return "Archive card"
}

func (a *ArchiveCardAction) Description() string {
	return "Archive the card (remove from board view)"
}

func (a *ArchiveCardAction) Schema() ActionSchema {
	// Archive card has no configuration options
	return ActionSchema{
		Properties: map[string]PropertySchema{},
	}
}

func (a *ArchiveCardAction) SentenceTemplate() string {
	return "archive the card"
}

func (a *ArchiveCardAction) Validate(config map[string]interface{}) error {
	// No config to validate
	return nil
}

func (a *ArchiveCardAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	if err := a.cardRepo.Archive(ctx.CardID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to archive card: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          "Card archived",
		AffectedEntities: []uuid.UUID{ctx.CardID},
	}
}

func (a *ArchiveCardAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryCard,
		Icon:                 "archive",
		IsDestructive:        true,
		RequiresConfirmation: true,
	}
}

// ============================================================================
// UNARCHIVE CARD ACTION
// ============================================================================

// UnarchiveCardAction restores an archived card.
type UnarchiveCardAction struct {
	cardRepo *repository.CardRepository
}

// NewUnarchiveCardAction creates a new UnarchiveCardAction.
func NewUnarchiveCardAction(cardRepo *repository.CardRepository) *UnarchiveCardAction {
	return &UnarchiveCardAction{cardRepo: cardRepo}
}

func (a *UnarchiveCardAction) ID() string {
	return "unarchive_card"
}

func (a *UnarchiveCardAction) Name() string {
	return "Restore card"
}

func (a *UnarchiveCardAction) Description() string {
	return "Restore an archived card back to the board"
}

func (a *UnarchiveCardAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{},
	}
}

func (a *UnarchiveCardAction) SentenceTemplate() string {
	return "restore the card from archive"
}

func (a *UnarchiveCardAction) Validate(config map[string]interface{}) error {
	return nil
}

func (a *UnarchiveCardAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	if err := a.cardRepo.Unarchive(ctx.CardID); err != nil {
		return NewErrorResult(fmt.Errorf("failed to unarchive card: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          "Card restored from archive",
		AffectedEntities: []uuid.UUID{ctx.CardID},
	}
}

func (a *UnarchiveCardAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryCard,
		Icon:                 "archive-restore",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}

// ============================================================================
// SET DUE DATE ACTION
// ============================================================================

// SetDueDateAction sets or updates the due date of a card.
type SetDueDateAction struct {
	cardRepo *repository.CardRepository
}

// NewSetDueDateAction creates a new SetDueDateAction.
func NewSetDueDateAction(cardRepo *repository.CardRepository) *SetDueDateAction {
	return &SetDueDateAction{cardRepo: cardRepo}
}

func (a *SetDueDateAction) ID() string {
	return "set_due_date"
}

func (a *SetDueDateAction) Name() string {
	return "Set due date"
}

func (a *SetDueDateAction) Description() string {
	return "Set the card's due date relative to now"
}

func (a *SetDueDateAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{
			"relative_value": {
				Type:        PropertyTypeNumber,
				Required:    true,
				Label:       "In",
				Description: "Number of days/weeks/hours from now",
				Default:     7,
			},
			"relative_unit": {
				Type:        PropertyTypeString,
				Required:    true,
				Label:       "Unit",
				Description: "Time unit",
				UIWidget:    UIWidgetSelect,
				Options: []SelectOption{
					{Value: "h", Label: "hours"},
					{Value: "d", Label: "days"},
					{Value: "w", Label: "weeks"},
				},
				Default: "d",
			},
		},
		Order: []string{"relative_value", "relative_unit"},
	}
}

func (a *SetDueDateAction) SentenceTemplate() string {
	return "set due date to {relative_value} {relative_unit} from now"
}

func (a *SetDueDateAction) Validate(config map[string]interface{}) error {
	// Validate relative_value
	if _, ok := config["relative_value"]; !ok {
		return errors.New("relative_value is required")
	}
	
	// Validate relative_unit
	unit, _ := config["relative_unit"].(string)
	if unit == "" {
		unit = "d"
	}
	if unit != "h" && unit != "d" && unit != "w" {
		return errors.New("relative_unit must be 'h', 'd', or 'w'")
	}
	
	return nil
}

func (a *SetDueDateAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	// Get relative value and unit - handle string, float64, and int types
	relativeValue := 7 // default
	if val, ok := ctx.Config["relative_value"].(float64); ok {
		relativeValue = int(val)
	} else if val, ok := ctx.Config["relative_value"].(int); ok {
		relativeValue = val
	} else if val, ok := ctx.Config["relative_value"].(string); ok {
		// Database may store as string
		if parsed, err := strconv.Atoi(val); err == nil {
			relativeValue = parsed
		}
	}
	
	relativeUnit, _ := ctx.Config["relative_unit"].(string)
	if relativeUnit == "" {
		relativeUnit = "d"
	}

	// Get the card
	card, err := a.cardRepo.FindByID(ctx.CardID)
	if err != nil {
		return NewErrorResult(fmt.Errorf("card not found: %v", err))
	}

	// Build duration string and parse
	durationStr := fmt.Sprintf("%d%s", relativeValue, relativeUnit)
	duration, err := parseRelativeDuration(durationStr)
	if err != nil {
		return NewErrorResult(fmt.Errorf("invalid relative date: %v", err))
	}
	dueDate := time.Now().Add(duration)

	// Update card
	card.DueDate = &dueDate
	if err := a.cardRepo.Update(card); err != nil {
		return NewErrorResult(fmt.Errorf("failed to update due date: %v", err))
	}

	return ActionResult{
		Success:          true,
		Message:          fmt.Sprintf("Due date set to %s", dueDate.Format("2006-01-02 15:04")),
		AffectedEntities: []uuid.UUID{ctx.CardID},
		Data: map[string]interface{}{
			"due_date": dueDate.Format(time.RFC3339),
		},
	}
}

func (a *SetDueDateAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryCard,
		Icon:                 "calendar",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// parseRelativeDuration parses strings like "7d", "1w", "2h" into time.Duration
func parseRelativeDuration(s string) (time.Duration, error) {
	if len(s) < 2 {
		return 0, errors.New("duration too short")
	}

	unit := s[len(s)-1]
	numStr := s[:len(s)-1]

	var num int
	_, err := fmt.Sscanf(numStr, "%d", &num)
	if err != nil {
		return 0, err
	}

	switch unit {
	case 'h':
		return time.Duration(num) * time.Hour, nil
	case 'd':
		return time.Duration(num) * 24 * time.Hour, nil
	case 'w':
		return time.Duration(num) * 7 * 24 * time.Hour, nil
	case 'm':
		return time.Duration(num) * 30 * 24 * time.Hour, nil // approximate month
	default:
		return 0, fmt.Errorf("unknown unit: %c", unit)
	}
}

// ============================================================================
// CLEAR DUE DATE ACTION
// ============================================================================

// ClearDueDateAction removes the due date from a card.
type ClearDueDateAction struct {
	cardRepo *repository.CardRepository
}

// NewClearDueDateAction creates a new ClearDueDateAction.
func NewClearDueDateAction(cardRepo *repository.CardRepository) *ClearDueDateAction {
	return &ClearDueDateAction{cardRepo: cardRepo}
}

func (a *ClearDueDateAction) ID() string {
	return "clear_due_date"
}

func (a *ClearDueDateAction) Name() string {
	return "Clear due date"
}

func (a *ClearDueDateAction) Description() string {
	return "Remove the due date from the card"
}

func (a *ClearDueDateAction) Schema() ActionSchema {
	return ActionSchema{
		Properties: map[string]PropertySchema{},
		Order:      []string{},
	}
}

func (a *ClearDueDateAction) SentenceTemplate() string {
	return "clear the due date"
}

func (a *ClearDueDateAction) Validate(config map[string]interface{}) error {
	return nil // No config needed
}

func (a *ClearDueDateAction) Execute(ctx ActionContext) ActionResult {
	if ctx.CardID == uuid.Nil {
		return NewErrorResult(errors.New("card_id missing in context"))
	}

	card, err := a.cardRepo.FindByID(ctx.CardID)
	if err != nil {
		return NewErrorResult(fmt.Errorf("card not found: %v", err))
	}

	card.DueDate = nil
	if err := a.cardRepo.Update(card); err != nil {
		return NewErrorResult(fmt.Errorf("failed to clear due date: %v", err))
	}

	return ActionResult{
		Success: true,
		Message: "Due date cleared",
	}
}

func (a *ClearDueDateAction) Metadata() ActionMetadata {
	return ActionMetadata{
		Category:             CategoryCard,
		Icon:                 "calendar-minus",
		IsDestructive:        false,
		RequiresConfirmation: false,
	}
}
