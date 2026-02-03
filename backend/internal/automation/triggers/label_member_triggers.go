package triggers

import (
	"errors"

	"github.com/google/uuid"
)

// ============================================================================
// LABEL CHANGED TRIGGER
// ============================================================================

// LabelChangedTrigger fires when a label is added to or removed from a card.
type LabelChangedTrigger struct{}

func (t *LabelChangedTrigger) ID() string {
	return "label_changed"
}

func (t *LabelChangedTrigger) Name() string {
	return "Label added/removed"
}

func (t *LabelChangedTrigger) Description() string {
	return "Triggers when a label is added to or removed from a card"
}

func (t *LabelChangedTrigger) Events() []string {
	return []string{"card.label_added", "card.label_removed"}
}

func (t *LabelChangedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"verb": {
				Type:        "string",
				Required:    false,
				Label:       "When",
				Description: "Label action type",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "added to", Label: "Label added"},
					{Value: "removed from", Label: "Label removed"},
					{Value: "any", Label: "Either"},
				},
				Default: "added to",
			},
			"label_id": {
				Type:        "string",
				Required:    false,
				Label:       "Label",
				Description: "Specific label to watch (optional)",
				UIWidget:    "label_picker",
			},
		},
		Order: []string{"verb", "label_id"},
	}
}

func (t *LabelChangedTrigger) SentenceTemplate() string {
	return "when label {label_id} is {verb} a card"
}

func (t *LabelChangedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// Check verb
	verb, _ := config["verb"].(string)
	switch verb {
	case "added to":
		if ctx.EventType != "card.label_added" {
			return false
		}
	case "removed from":
		if ctx.EventType != "card.label_removed" {
			return false
		}
	// "any" or empty matches both
	}

	// Check label_id if specified
	if labelID, ok := config["label_id"].(string); ok && labelID != "" {
		contextLabelID := ctx.GetString("label_id")
		if labelID != contextLabelID {
			return false
		}
	}

	return true
}

func (t *LabelChangedTrigger) Validate(config map[string]interface{}) error {
	// Validate label_id format if provided
	if labelID, ok := config["label_id"].(string); ok && labelID != "" {
		if _, err := uuid.Parse(labelID); err != nil {
			return errors.New("label_id must be a valid UUID")
		}
	}
	return nil
}

func (t *LabelChangedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryLabel,
		Icon:     "tag",
	}
}

// ============================================================================
// MEMBER CHANGED TRIGGER
// ============================================================================

// MemberChangedTrigger fires when a member is added to or removed from a card.
type MemberChangedTrigger struct{}

func (t *MemberChangedTrigger) ID() string {
	return "member_changed"
}

func (t *MemberChangedTrigger) Name() string {
	return "Member assigned/unassigned"
}

func (t *MemberChangedTrigger) Description() string {
	return "Triggers when a member is assigned to or removed from a card"
}

func (t *MemberChangedTrigger) Events() []string {
	return []string{"card.member_added", "card.member_removed"}
}

func (t *MemberChangedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"verb": {
				Type:        "string",
				Required:    false,
				Label:       "When",
				Description: "Member action type",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "added to", Label: "Member assigned"},
					{Value: "removed from", Label: "Member unassigned"},
					{Value: "any", Label: "Either"},
				},
				Default: "added to",
			},
			"user_id": {
				Type:        "string",
				Required:    false,
				Label:       "Member",
				Description: "Specific member to watch (optional)",
				UIWidget:    "user_picker",
			},
		},
		Order: []string{"verb", "user_id"},
	}
}

func (t *MemberChangedTrigger) SentenceTemplate() string {
	return "when member {user_id} is {verb} a card"
}

func (t *MemberChangedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// Check verb
	verb, _ := config["verb"].(string)
	switch verb {
	case "added to":
		if ctx.EventType != "card.member_added" {
			return false
		}
	case "removed from":
		if ctx.EventType != "card.member_removed" {
			return false
		}
	// "any" or empty matches both
	}

	// Check user_id if specified
	if userID, ok := config["user_id"].(string); ok && userID != "" {
		contextUserID := ctx.GetString("member_id")
		if userID != contextUserID {
			return false
		}
	}

	return true
}

func (t *MemberChangedTrigger) Validate(config map[string]interface{}) error {
	// Validate user_id format if provided
	if userID, ok := config["user_id"].(string); ok && userID != "" {
		if _, err := uuid.Parse(userID); err != nil {
			return errors.New("user_id must be a valid UUID")
		}
	}
	return nil
}

func (t *MemberChangedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryMember,
		Icon:     "user",
	}
}

// ============================================================================
// MEMBER ME CHANGED TRIGGER
// ============================================================================

// MemberMeChangedTrigger fires when the current user (who set up the rule) is added/removed.
type MemberMeChangedTrigger struct{}

func (t *MemberMeChangedTrigger) ID() string {
	return "member_me_changed"
}

func (t *MemberMeChangedTrigger) Name() string {
	return "I am assigned/unassigned"
}

func (t *MemberMeChangedTrigger) Description() string {
	return "Triggers when you are assigned to or removed from a card"
}

func (t *MemberMeChangedTrigger) Events() []string {
	return []string{"card.member_added", "card.member_removed"}
}

func (t *MemberMeChangedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"verb": {
				Type:        "string",
				Required:    false,
				Label:       "When",
				Description: "Action type",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "added to", Label: "I am assigned"},
					{Value: "removed from", Label: "I am unassigned"},
					{Value: "any", Label: "Either"},
				},
				Default: "added to",
			},
		},
		Order: []string{"verb"},
	}
}

func (t *MemberMeChangedTrigger) SentenceTemplate() string {
	return "when I am {verb} a card"
}

func (t *MemberMeChangedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// Check verb
	verb, _ := config["verb"].(string)
	switch verb {
	case "added to":
		if ctx.EventType != "card.member_added" {
			return false
		}
	case "removed from":
		if ctx.EventType != "card.member_removed" {
			return false
		}
	}

	// Check if the affected member is the rule creator (stored in config)
	// This requires the rule creator ID to be stored in the config
	ruleCreatorID, _ := config["rule_creator_id"].(string)
	if ruleCreatorID == "" {
		// Fallback: can't verify "me" without creator ID
		return true
	}

	memberID := ctx.GetString("member_id")
	return memberID == ruleCreatorID
}

func (t *MemberMeChangedTrigger) Validate(config map[string]interface{}) error {
	return nil
}

func (t *MemberMeChangedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryMember,
		Icon:     "user-check",
	}
}

// ============================================================================
// DUE DATE CHANGED TRIGGER
// ============================================================================

// DueDateChangedTrigger fires when a card's due date is added, changed, or removed.
type DueDateChangedTrigger struct{}

func (t *DueDateChangedTrigger) ID() string {
	return "date_changed"
}

func (t *DueDateChangedTrigger) Name() string {
	return "Due date changed"
}

func (t *DueDateChangedTrigger) Description() string {
	return "Triggers when a card's due date is added, changed, or removed"
}

func (t *DueDateChangedTrigger) Events() []string {
	return []string{"card.due_date_changed"}
}

func (t *DueDateChangedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{},
	}
}

func (t *DueDateChangedTrigger) SentenceTemplate() string {
	return "when a card's due date is changed"
}

func (t *DueDateChangedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// No additional conditions, just the event type match
	return true
}

func (t *DueDateChangedTrigger) Validate(config map[string]interface{}) error {
	return nil
}

func (t *DueDateChangedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryDate,
		Icon:     "calendar",
	}
}
