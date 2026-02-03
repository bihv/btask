package triggers

// ============================================================================
// CARD CREATED TRIGGER
// ============================================================================

// CardCreatedTrigger fires when a new card is created.
type CardCreatedTrigger struct{}

func (t *CardCreatedTrigger) ID() string {
	return "card_created"
}

func (t *CardCreatedTrigger) Name() string {
	return "Card created"
}

func (t *CardCreatedTrigger) Description() string {
	return "Triggers when a new card is created on the board"
}

func (t *CardCreatedTrigger) Events() []string {
	return []string{"card.created"}
}

func (t *CardCreatedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"list_id": {
				Type:        "string",
				Required:    false,
				Label:       "In List",
				Description: "Only trigger when card is created in this list (optional)",
				UIWidget:    "list_picker",
			},
		},
		Order: []string{"list_id"},
	}
}

func (t *CardCreatedTrigger) SentenceTemplate() string {
	return "when a card is created in {list_id}"
}

func (t *CardCreatedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// If list_id is specified, check it matches
	if listID, ok := config["list_id"].(string); ok && listID != "" {
		if ctx.GetString("list_id") != listID {
			return false
		}
	}
	return true
}

func (t *CardCreatedTrigger) Validate(config map[string]interface{}) error {
	// list_id is optional, no validation needed
	return nil
}

func (t *CardCreatedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryCard,
		Icon:     "plus-square",
	}
}

// ============================================================================
// CARD ADDED TO LIST TRIGGER
// ============================================================================

// CardAddedToListTrigger fires when a card is added to a specific list.
// This can happen via creation or movement.
type CardAddedToListTrigger struct{}

func (t *CardAddedToListTrigger) ID() string {
	return "card_added_to_list"
}

func (t *CardAddedToListTrigger) Name() string {
	return "Card added to list"
}

func (t *CardAddedToListTrigger) Description() string {
	return "Triggers when a card is created in or moved to a specific list"
}

func (t *CardAddedToListTrigger) Events() []string {
	return []string{"card.created", "card.moved"}
}

func (t *CardAddedToListTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"list_id": {
				Type:        "string",
				Required:    true,
				Label:       "List",
				Description: "The list to watch for new cards",
				UIWidget:    "list_picker",
			},
			"verb": {
				Type:        "string",
				Required:    false,
				Label:       "When",
				Description: "How the card arrives in the list",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "added to", Label: "Added to (created or moved)"},
					{Value: "created in", Label: "Created in"},
					{Value: "moved into", Label: "Moved into"},
				},
				Default: "added to",
			},
		},
		Order: []string{"list_id", "verb"},
	}
}

func (t *CardAddedToListTrigger) SentenceTemplate() string {
	return "when a card is {verb} {list_id}"
}

func (t *CardAddedToListTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// Check list_id matches
	listID, _ := config["list_id"].(string)
	if listID != "" {
		contextListID := ctx.GetString("list_id")
		if listID != contextListID {
			return false
		}
	}

	// Check verb
	verb, _ := config["verb"].(string)
	switch verb {
	case "created in":
		if ctx.EventType != "card.created" {
			return false
		}
	case "moved into":
		if ctx.EventType != "card.moved" {
			return false
		}
	// "added to" or empty matches both
	}

	return true
}

func (t *CardAddedToListTrigger) Validate(config map[string]interface{}) error {
	// list_id is technically required but we allow empty for "any list"
	return nil
}

func (t *CardAddedToListTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryCard,
		Icon:     "arrow-right-to-line",
	}
}

// ============================================================================
// CARD MOVED TRIGGER
// ============================================================================

// CardMovedTrigger fires when a card is moved between lists.
type CardMovedTrigger struct{}

func (t *CardMovedTrigger) ID() string {
	return "card_moved"
}

func (t *CardMovedTrigger) Name() string {
	return "Card moved"
}

func (t *CardMovedTrigger) Description() string {
	return "Triggers when a card is moved to a different list"
}

func (t *CardMovedTrigger) Events() []string {
	return []string{"card.moved"}
}

func (t *CardMovedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"from_list_id": {
				Type:        "string",
				Required:    false,
				Label:       "From List",
				Description: "Only trigger when moved from this list (optional)",
				UIWidget:    "list_picker",
			},
			"to_list_id": {
				Type:        "string",
				Required:    false,
				Label:       "To List",
				Description: "Only trigger when moved to this list (optional)",
				UIWidget:    "list_picker",
			},
		},
		Order: []string{"from_list_id", "to_list_id"},
	}
}

func (t *CardMovedTrigger) SentenceTemplate() string {
	return "when a card is moved from {from_list_id} to {to_list_id}"
}

func (t *CardMovedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	// Check from_list_id if specified
	if fromListID, ok := config["from_list_id"].(string); ok && fromListID != "" {
		if ctx.GetString("old_list_id") != fromListID {
			return false
		}
	}

	// Check to_list_id if specified
	if toListID, ok := config["to_list_id"].(string); ok && toListID != "" {
		if ctx.GetString("list_id") != toListID {
			return false
		}
	}

	return true
}

func (t *CardMovedTrigger) Validate(config map[string]interface{}) error {
	return nil
}

func (t *CardMovedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryCard,
		Icon:     "arrow-right",
	}
}

// ============================================================================
// CARD ARCHIVED TRIGGER
// ============================================================================

// CardArchivedTrigger fires when a card is archived or unarchived.
type CardArchivedTrigger struct{}

func (t *CardArchivedTrigger) ID() string {
	return "card_archived"
}

func (t *CardArchivedTrigger) Name() string {
	return "Card archived/unarchived"
}

func (t *CardArchivedTrigger) Description() string {
	return "Triggers when a card is archived or restored from archive"
}

func (t *CardArchivedTrigger) Events() []string {
	return []string{"card.archived", "card.unarchived"}
}

func (t *CardArchivedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"verb": {
				Type:        "string",
				Required:    false,
				Label:       "When",
				Description: "Archive action type",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "archived", Label: "Archived"},
					{Value: "unarchived", Label: "Unarchived"},
					{Value: "any", Label: "Either"},
				},
				Default: "archived",
			},
		},
		Order: []string{"verb"},
	}
}

func (t *CardArchivedTrigger) SentenceTemplate() string {
	return "when a card is {verb}"
}

func (t *CardArchivedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	verb, _ := config["verb"].(string)
	
	switch verb {
	case "archived":
		return ctx.EventType == "card.archived"
	case "unarchived":
		return ctx.EventType == "card.unarchived"
	default: // "any" or empty
		return true
	}
}

func (t *CardArchivedTrigger) Validate(config map[string]interface{}) error {
	return nil
}

func (t *CardArchivedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryCard,
		Icon:     "archive",
	}
}

// ============================================================================
// CARD STATUS CHANGED TRIGGER
// ============================================================================

// CardStatusChangedTrigger fires when a card's completion status changes.
type CardStatusChangedTrigger struct{}

func (t *CardStatusChangedTrigger) ID() string {
	return "card_status_changed"
}

func (t *CardStatusChangedTrigger) Name() string {
	return "Card completed/incomplete"
}

func (t *CardStatusChangedTrigger) Description() string {
	return "Triggers when a card is marked complete or incomplete"
}

func (t *CardStatusChangedTrigger) Events() []string {
	return []string{"card.completed", "card.incomplete"}
}

func (t *CardStatusChangedTrigger) Schema() TriggerSchema {
	return TriggerSchema{
		Properties: map[string]TriggerPropertySchema{
			"status": {
				Type:        "string",
				Required:    false,
				Label:       "Status",
				Description: "The completion status to watch for",
				UIWidget:    "select",
				Options: []SelectOption{
					{Value: "complete", Label: "Marked complete"},
					{Value: "incomplete", Label: "Marked incomplete"},
					{Value: "any", Label: "Either"},
				},
				Default: "complete",
			},
		},
		Order: []string{"status"},
	}
}

func (t *CardStatusChangedTrigger) SentenceTemplate() string {
	return "when a card is {status}"
}

func (t *CardStatusChangedTrigger) Match(ctx TriggerContext, config map[string]interface{}) bool {
	status, _ := config["status"].(string)
	
	switch status {
	case "complete":
		return ctx.EventType == "card.completed"
	case "incomplete":
		return ctx.EventType == "card.incomplete"
	default: // "any" or empty
		return true
	}
}

func (t *CardStatusChangedTrigger) Validate(config map[string]interface{}) error {
	return nil
}

func (t *CardStatusChangedTrigger) Metadata() TriggerMetadata {
	return TriggerMetadata{
		Category: TriggerCategoryCard,
		Icon:     "check-circle",
	}
}
