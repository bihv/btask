package triggers

import (
	"fmt"
	"log"
	"sync"
)

// ============================================================================
// TRIGGER REGISTRY - Singleton Pattern with Thread Safety
// ============================================================================

// TriggerRegistry is a thread-safe registry for trigger matchers.
// It provides efficient lookup and matching for automation triggers.
type TriggerRegistry struct {
	triggers     map[string]TriggerMatcher
	eventIndex   map[string][]TriggerMatcher // Index by event type for fast lookup
	mu           sync.RWMutex
}

// Global registry instance
var (
	globalTriggerRegistry *TriggerRegistry
	triggerRegistryOnce   sync.Once
)

// Registry returns the global trigger registry singleton.
func Registry() *TriggerRegistry {
	triggerRegistryOnce.Do(func() {
		globalTriggerRegistry = &TriggerRegistry{
			triggers:   make(map[string]TriggerMatcher),
			eventIndex: make(map[string][]TriggerMatcher),
		}
	})
	return globalTriggerRegistry
}

// Register adds a trigger matcher to the registry.
// Also updates the event index for fast lookup.
func (r *TriggerRegistry) Register(trigger TriggerMatcher) {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := trigger.ID()
	
	// Remove from event index if overwriting
	if existing, exists := r.triggers[id]; exists {
		log.Printf("[TriggerRegistry] Overwriting existing trigger: %s", id)
		r.removeFromEventIndex(existing)
	}

	r.triggers[id] = trigger

	// Add to event index
	for _, event := range trigger.Events() {
		r.eventIndex[event] = append(r.eventIndex[event], trigger)
	}

	log.Printf("[TriggerRegistry] Registered trigger: %s (%s) - events: %v", 
		id, trigger.Name(), trigger.Events())
}

// removeFromEventIndex removes a trigger from the event index
func (r *TriggerRegistry) removeFromEventIndex(trigger TriggerMatcher) {
	for _, event := range trigger.Events() {
		triggers := r.eventIndex[event]
		for i, t := range triggers {
			if t.ID() == trigger.ID() {
				r.eventIndex[event] = append(triggers[:i], triggers[i+1:]...)
				break
			}
		}
	}
}

// RegisterMany registers multiple triggers at once.
func (r *TriggerRegistry) RegisterMany(triggers ...TriggerMatcher) {
	for _, trigger := range triggers {
		r.Register(trigger)
	}
}

// Get retrieves a trigger matcher by ID.
func (r *TriggerRegistry) Get(id string) TriggerMatcher {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.triggers[id]
}

// Has checks if a trigger with the given ID is registered.
func (r *TriggerRegistry) Has(id string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, exists := r.triggers[id]
	return exists
}

// GetTriggersForEvent returns all triggers that listen to a specific event.
// Uses the event index for O(1) lookup.
func (r *TriggerRegistry) GetTriggersForEvent(eventType string) []TriggerMatcher {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Return a copy to prevent external modification
	triggers := r.eventIndex[eventType]
	result := make([]TriggerMatcher, len(triggers))
	copy(result, triggers)
	return result
}

// Match checks if a specific trigger (by ID) matches the given context and config.
func (r *TriggerRegistry) Match(triggerID string, ctx TriggerContext, config map[string]interface{}) bool {
	trigger := r.Get(triggerID)
	if trigger == nil {
		log.Printf("[TriggerRegistry] Unknown trigger ID: %s", triggerID)
		return false
	}

	// First check if this trigger listens to the event type
	eventMatch := false
	for _, event := range trigger.Events() {
		if event == ctx.EventType {
			eventMatch = true
			break
		}
	}
	if !eventMatch {
		return false
	}

	// Then check the trigger-specific conditions
	return trigger.Match(ctx, config)
}

// FindMatchingTriggers finds all triggers that match the given event.
// This is useful for discovering which triggers could fire for an event.
func (r *TriggerRegistry) FindMatchingTriggers(ctx TriggerContext) []TriggerMatcher {
	triggers := r.GetTriggersForEvent(ctx.EventType)
	
	// Note: This returns potential matches based on event type only.
	// The actual match still requires the trigger config from the rule.
	return triggers
}

// Validate validates a trigger configuration.
func (r *TriggerRegistry) Validate(triggerID string, config map[string]interface{}) error {
	trigger := r.Get(triggerID)
	if trigger == nil {
		return fmt.Errorf("trigger not found: %s", triggerID)
	}

	return trigger.Validate(config)
}

// List returns all registered trigger matchers.
func (r *TriggerRegistry) List() []TriggerMatcher {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]TriggerMatcher, 0, len(r.triggers))
	for _, trigger := range r.triggers {
		list = append(list, trigger)
	}
	return list
}

// ListIDs returns all registered trigger IDs.
func (r *TriggerRegistry) ListIDs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.triggers))
	for id := range r.triggers {
		ids = append(ids, id)
	}
	return ids
}

// Count returns the number of registered triggers.
func (r *TriggerRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.triggers)
}

// Clear removes all registered triggers.
func (r *TriggerRegistry) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.triggers = make(map[string]TriggerMatcher)
	r.eventIndex = make(map[string][]TriggerMatcher)
	log.Printf("[TriggerRegistry] Cleared all triggers")
}

// ============================================================================
// TRIGGER INFO METHODS
// ============================================================================

// GetTriggerInfo returns the TriggerInfo for a registered trigger.
func (r *TriggerRegistry) GetTriggerInfo(id string) *TriggerInfo {
	trigger := r.Get(id)
	if trigger == nil {
		return nil
	}

	info := &TriggerInfo{
		ID:          trigger.ID(),
		Name:        trigger.Name(),
		Description: trigger.Description(),
		Events:      trigger.Events(),
		Schema:      trigger.Schema(),
	}

	if withMeta, ok := trigger.(TriggerMatcherWithMetadata); ok {
		meta := withMeta.Metadata()
		info.Metadata = &meta
	}

	return info
}

// ListTriggerInfos returns TriggerInfo for all registered triggers.
func (r *TriggerRegistry) ListTriggerInfos() []TriggerInfo {
	triggers := r.List()
	infos := make([]TriggerInfo, len(triggers))

	for i, trigger := range triggers {
		infos[i] = TriggerInfo{
			ID:               trigger.ID(),
			Name:             trigger.Name(),
			Description:      trigger.Description(),
			Events:           trigger.Events(),
			Schema:           trigger.Schema(),
			SentenceTemplate: trigger.SentenceTemplate(),
		}

		if withMeta, ok := trigger.(TriggerMatcherWithMetadata); ok {
			meta := withMeta.Metadata()
			infos[i].Metadata = &meta
		}
	}

	return infos
}

// ListByCategory returns triggers grouped by category.
func (r *TriggerRegistry) ListByCategory() map[TriggerCategory][]TriggerInfo {
	infos := r.ListTriggerInfos()
	grouped := make(map[TriggerCategory][]TriggerInfo)

	for _, info := range infos {
		category := TriggerCategoryCard // Default
		if info.Metadata != nil {
			category = info.Metadata.Category
		}
		grouped[category] = append(grouped[category], info)
	}

	return grouped
}
