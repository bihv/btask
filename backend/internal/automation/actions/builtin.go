package actions

import (
	"log"

	"github.com/mello/backend/internal/repository"
)

// InitBuiltinActions registers all built-in actions with the global registry.
// This should be called once during application startup.
func InitBuiltinActions(cardRepo *repository.CardRepository) {
	log.Println("[Automation] Initializing built-in actions...")

	registry := Registry()

	// Card Actions
	registry.Register(NewMoveCardAction(cardRepo))
	registry.Register(NewArchiveCardAction(cardRepo))
	registry.Register(NewUnarchiveCardAction(cardRepo))
	registry.Register(NewSetDueDateAction(cardRepo))
	registry.Register(NewClearDueDateAction(cardRepo))

	// Label Actions
	registry.Register(NewAddLabelAction(cardRepo))
	registry.Register(NewRemoveLabelAction(cardRepo))

	// Member Actions
	registry.Register(NewAddMemberAction(cardRepo))
	registry.Register(NewRemoveMemberAction(cardRepo))

	log.Printf("[Automation] Registered %d built-in actions", registry.Count())
}

// GetBuiltinActionIDs returns the list of built-in action IDs.
// Useful for distinguishing built-in actions from plugin actions.
func GetBuiltinActionIDs() []string {
	return []string{
		"move_card",
		"archive_card",
		"unarchive_card",
		"set_due_date",
		"add_label",
		"remove_label",
		"add_member",
		"remove_member",
	}
}
