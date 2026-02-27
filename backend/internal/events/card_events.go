package events

import "github.com/google/uuid"

// ============================================================================
// CARD DOMAIN EVENTS
// ============================================================================

// --- Card Created ---

type CardCreatedEvent struct {
	CardID   uuid.UUID
	ListID   uuid.UUID
	BoardID  uuid.UUID
	ListName string
	UserID   uuid.UUID
	Context  ExecutionContext
}

func (e CardCreatedEvent) EventName() string            { return "card.created" }
func (e CardCreatedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardCreatedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":   e.CardID.String(),
		"list_id":   e.ListID.String(),
		"board_id":  e.BoardID.String(),
		"list_name": e.ListName,
		"user_id":   e.UserID.String(),
	}
}

// --- Card Moved ---

type CardMovedEvent struct {
	CardID    uuid.UUID
	OldListID uuid.UUID
	NewListID uuid.UUID
	BoardID   uuid.UUID
	UserID    uuid.UUID
	Context   ExecutionContext
}

func (e CardMovedEvent) EventName() string            { return "card.moved" }
func (e CardMovedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardMovedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":     e.CardID.String(),
		"old_list_id": e.OldListID.String(),
		"list_id":     e.NewListID.String(),
		"board_id":    e.BoardID.String(),
		"user_id":     e.UserID.String(),
	}
}

// --- Card Due Date Changed ---

type CardDueDateChangedEvent struct {
	CardID  uuid.UUID
	ListID  uuid.UUID
	BoardID uuid.UUID
	UserID  uuid.UUID
	Context ExecutionContext
}

func (e CardDueDateChangedEvent) EventName() string            { return "card.due_date_changed" }
func (e CardDueDateChangedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardDueDateChangedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":  e.CardID.String(),
		"list_id":  e.ListID.String(),
		"board_id": e.BoardID.String(),
		"user_id":  e.UserID.String(),
	}
}

// --- Card Completed ---

type CardCompletedEvent struct {
	CardID      uuid.UUID
	ListID      uuid.UUID
	BoardID     uuid.UUID
	IsCompleted bool
	UserID      uuid.UUID
	Context     ExecutionContext
}

func (e CardCompletedEvent) EventName() string {
	if e.IsCompleted {
		return "card.completed"
	}
	return "card.incomplete"
}
func (e CardCompletedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardCompletedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":      e.CardID.String(),
		"list_id":      e.ListID.String(),
		"board_id":     e.BoardID.String(),
		"is_completed": e.IsCompleted,
		"user_id":      e.UserID.String(),
	}
}

// --- Card Label Added ---

type CardLabelAddedEvent struct {
	CardID  uuid.UUID
	LabelID uuid.UUID
	BoardID uuid.UUID
	UserID  uuid.UUID
	Context ExecutionContext
}

func (e CardLabelAddedEvent) EventName() string            { return "card.label_added" }
func (e CardLabelAddedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardLabelAddedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":  e.CardID.String(),
		"label_id": e.LabelID.String(),
		"board_id": e.BoardID.String(),
		"user_id":  e.UserID.String(),
	}
}

// --- Card Label Removed ---

type CardLabelRemovedEvent struct {
	CardID  uuid.UUID
	LabelID uuid.UUID
	BoardID uuid.UUID
	UserID  uuid.UUID
	Context ExecutionContext
}

func (e CardLabelRemovedEvent) EventName() string            { return "card.label_removed" }
func (e CardLabelRemovedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardLabelRemovedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":  e.CardID.String(),
		"label_id": e.LabelID.String(),
		"board_id": e.BoardID.String(),
		"user_id":  e.UserID.String(),
	}
}

// --- Card Member Added ---

type CardMemberAddedEvent struct {
	CardID   uuid.UUID
	MemberID uuid.UUID
	BoardID  uuid.UUID
	UserID   uuid.UUID
	Context  ExecutionContext
}

func (e CardMemberAddedEvent) EventName() string            { return "card.member_added" }
func (e CardMemberAddedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardMemberAddedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":   e.CardID.String(),
		"member_id": e.MemberID.String(),
		"board_id":  e.BoardID.String(),
		"user_id":   e.UserID.String(),
	}
}

// --- Card Member Removed ---

type CardMemberRemovedEvent struct {
	CardID   uuid.UUID
	MemberID uuid.UUID
	BoardID  uuid.UUID
	UserID   uuid.UUID
	Context  ExecutionContext
}

func (e CardMemberRemovedEvent) EventName() string            { return "card.member_removed" }
func (e CardMemberRemovedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardMemberRemovedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":   e.CardID.String(),
		"member_id": e.MemberID.String(),
		"board_id":  e.BoardID.String(),
		"user_id":   e.UserID.String(),
	}
}

// --- Card Archived ---

type CardArchivedEvent struct {
	CardID  uuid.UUID
	ListID  uuid.UUID
	BoardID uuid.UUID
	UserID  uuid.UUID
	Context ExecutionContext
}

func (e CardArchivedEvent) EventName() string            { return "card.archived" }
func (e CardArchivedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardArchivedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":  e.CardID.String(),
		"list_id":  e.ListID.String(),
		"board_id": e.BoardID.String(),
		"user_id":  e.UserID.String(),
	}
}

// --- Card Unarchived ---

type CardUnarchivedEvent struct {
	CardID  uuid.UUID
	ListID  uuid.UUID
	BoardID uuid.UUID
	UserID  uuid.UUID
	Context ExecutionContext
}

func (e CardUnarchivedEvent) EventName() string            { return "card.unarchived" }
func (e CardUnarchivedEvent) GetContext() ExecutionContext { return e.Context }
func (e CardUnarchivedEvent) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"card_id":  e.CardID.String(),
		"list_id":  e.ListID.String(),
		"board_id": e.BoardID.String(),
		"user_id":  e.UserID.String(),
	}
}
