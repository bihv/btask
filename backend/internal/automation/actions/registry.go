package actions

import (
	"fmt"
	"log"
	"sync"
)

// ============================================================================
// ACTION REGISTRY - Singleton Pattern with Thread Safety
// ============================================================================

// ActionRegistry is a thread-safe registry for action executors.
// It provides O(1) lookup for actions by ID and supports runtime registration.
type ActionRegistry struct {
	actions map[string]ActionExecutor
	mu      sync.RWMutex
}

// Global registry instance - initialized on first access
var (
	globalRegistry *ActionRegistry
	registryOnce   sync.Once
)

// Registry returns the global action registry singleton.
// Use this to register and execute actions.
func Registry() *ActionRegistry {
	registryOnce.Do(func() {
		globalRegistry = &ActionRegistry{
			actions: make(map[string]ActionExecutor),
		}
	})
	return globalRegistry
}

// Register adds an action executor to the registry.
// If an action with the same ID already exists, it will be overwritten.
// This allows plugins to override built-in actions if needed.
func (r *ActionRegistry) Register(action ActionExecutor) {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := action.ID()
	if _, exists := r.actions[id]; exists {
		log.Printf("[ActionRegistry] Overwriting existing action: %s", id)
	}

	r.actions[id] = action
	log.Printf("[ActionRegistry] Registered action: %s (%s)", id, action.Name())
}

// RegisterMany registers multiple actions at once.
// Convenience method for bulk registration.
func (r *ActionRegistry) RegisterMany(actions ...ActionExecutor) {
	for _, action := range actions {
		r.Register(action)
	}
}

// Get retrieves an action executor by ID.
// Returns nil if the action is not found.
func (r *ActionRegistry) Get(id string) ActionExecutor {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.actions[id]
}

// Has checks if an action with the given ID is registered.
func (r *ActionRegistry) Has(id string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, exists := r.actions[id]
	return exists
}

// Execute runs an action by ID with the given context.
// Returns an error result if the action is not found.
func (r *ActionRegistry) Execute(actionID string, ctx ActionContext) ActionResult {
	r.mu.RLock()
	action, ok := r.actions[actionID]
	r.mu.RUnlock()

	if !ok {
		return ActionResult{
			Success: false,
			Message: fmt.Sprintf("Unknown action: %s", actionID),
			Error:   fmt.Errorf("action not found: %s", actionID),
		}
	}

	// Log execution start
	log.Printf("[ActionRegistry] Executing action: %s (card=%s)", actionID, ctx.CardID)

	// Execute the action
	result := action.Execute(ctx)

	// Log result
	if result.Success {
		log.Printf("[ActionRegistry] Action %s completed successfully: %s", actionID, result.Message)
	} else {
		log.Printf("[ActionRegistry] Action %s failed: %s", actionID, result.Message)
	}

	return result
}

// Validate validates an action's config by ID.
// Returns an error if the action is not found or validation fails.
func (r *ActionRegistry) Validate(actionID string, config map[string]interface{}) error {
	r.mu.RLock()
	action, ok := r.actions[actionID]
	r.mu.RUnlock()

	if !ok {
		return fmt.Errorf("action not found: %s", actionID)
	}

	return action.Validate(config)
}

// List returns all registered action executors.
// Useful for generating UI action pickers.
func (r *ActionRegistry) List() []ActionExecutor {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]ActionExecutor, 0, len(r.actions))
	for _, action := range r.actions {
		list = append(list, action)
	}
	return list
}

// ListIDs returns all registered action IDs.
func (r *ActionRegistry) ListIDs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.actions))
	for id := range r.actions {
		ids = append(ids, id)
	}
	return ids
}

// Count returns the number of registered actions.
func (r *ActionRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.actions)
}

// Clear removes all registered actions.
// Useful for testing.
func (r *ActionRegistry) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.actions = make(map[string]ActionExecutor)
	log.Printf("[ActionRegistry] Cleared all actions")
}

// ============================================================================
// ACTION INFO DTO - For API responses
// ============================================================================

// ActionInfo contains the serializable information about an action.
// Used for API responses when listing available actions.
type ActionInfo struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Description      string          `json:"description"`
	Schema           ActionSchema    `json:"schema"`
	SentenceTemplate string          `json:"sentence_template,omitempty"`
	Metadata         *ActionMetadata `json:"metadata,omitempty"`
}

// GetActionInfo returns the ActionInfo for a registered action.
func (r *ActionRegistry) GetActionInfo(id string) *ActionInfo {
	action := r.Get(id)
	if action == nil {
		return nil
	}

	info := &ActionInfo{
		ID:               action.ID(),
		Name:             action.Name(),
		Description:      action.Description(),
		Schema:           action.Schema(),
		SentenceTemplate: action.SentenceTemplate(),
	}

	// Include metadata if the action implements ActionExecutorWithMetadata
	if withMeta, ok := action.(ActionExecutorWithMetadata); ok {
		meta := withMeta.Metadata()
		info.Metadata = &meta
	}

	return info
}

// ListActionInfos returns ActionInfo for all registered actions.
// Useful for API endpoints that need to list available actions.
func (r *ActionRegistry) ListActionInfos() []ActionInfo {
	actions := r.List()
	infos := make([]ActionInfo, len(actions))

	for i, action := range actions {
		infos[i] = ActionInfo{
			ID:               action.ID(),
			Name:             action.Name(),
			Description:      action.Description(),
			Schema:           action.Schema(),
			SentenceTemplate: action.SentenceTemplate(),
		}

		// Include metadata if available
		if withMeta, ok := action.(ActionExecutorWithMetadata); ok {
			meta := withMeta.Metadata()
			infos[i].Metadata = &meta
		}
	}

	return infos
}

// ============================================================================
// CATEGORY GROUPING - For UI Organization
// ============================================================================

// ListByCategory returns actions grouped by category.
func (r *ActionRegistry) ListByCategory() map[ActionCategory][]ActionInfo {
	infos := r.ListActionInfos()
	grouped := make(map[ActionCategory][]ActionInfo)

	for _, info := range infos {
		category := CategoryCard // Default category
		if info.Metadata != nil {
			category = info.Metadata.Category
		}

		grouped[category] = append(grouped[category], info)
	}

	return grouped
}
