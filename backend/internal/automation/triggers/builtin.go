package triggers

import (
	"log"
)

// InitBuiltinTriggers registers all built-in triggers with the global registry.
// This should be called once during application startup.
func InitBuiltinTriggers() {
	log.Println("[Automation] Initializing built-in triggers...")

	registry := Registry()

	// Card Triggers
	registry.Register(&CardCreatedTrigger{})
	registry.Register(&CardAddedToListTrigger{})
	registry.Register(&CardMovedTrigger{})
	registry.Register(&CardArchivedTrigger{})
	registry.Register(&CardStatusChangedTrigger{})

	// Label Triggers
	registry.Register(&LabelChangedTrigger{})

	// Member Triggers
	registry.Register(&MemberChangedTrigger{})
	registry.Register(&MemberMeChangedTrigger{})

	// Date Triggers
	registry.Register(&DueDateChangedTrigger{})

	log.Printf("[Automation] Registered %d built-in triggers", registry.Count())
}

// GetBuiltinTriggerIDs returns the list of built-in trigger IDs.
func GetBuiltinTriggerIDs() []string {
	return []string{
		"card_created",
		"card_added_to_list",
		"card_moved",
		"card_archived",
		"card_status_changed",
		"label_changed",
		"member_changed",
		"member_me_changed",
		"date_changed",
	}
}
