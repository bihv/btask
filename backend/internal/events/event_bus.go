package events

import (
	"log"
	"sync"
)

// ============================================================================
// EVENT BUS - Decoupled pub/sub for domain events
// ============================================================================

// DomainEvent is the interface all domain events must implement.
type DomainEvent interface {
	// EventName returns the event type string (e.g., "card.created")
	EventName() string
	// GetContext returns the execution context for recursion tracking
	GetContext() ExecutionContext
	// ToMap converts the event to a map for backward compatibility with ProcessEvent
	ToMap() map[string]interface{}
}

// EventHandler is a function that handles a domain event.
type EventHandler func(event DomainEvent)

// EventBus provides async pub/sub for domain events with recursion protection.
type EventBus struct {
	handlers map[string][]EventHandler
	mu       sync.RWMutex
}

// NewEventBus creates a new EventBus instance.
func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[string][]EventHandler),
	}
}

// Subscribe registers a handler for a specific event type.
func (bus *EventBus) Subscribe(eventName string, handler EventHandler) {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	bus.handlers[eventName] = append(bus.handlers[eventName], handler)
	log.Printf("[EventBus] Subscribed to event: %s (total handlers: %d)", eventName, len(bus.handlers[eventName]))
}

// Publish dispatches an event to all registered handlers asynchronously.
// It checks the ExecutionContext to prevent infinite recursion.
func (bus *EventBus) Publish(event DomainEvent) {
	ctx := event.GetContext()

	// Recursion guard: check if we've exceeded max depth
	if !ctx.CanCascade() {
		log.Printf("[EventBus] ⛔ Blocked event '%s' — recursion depth %d exceeds max %d (source rule: %s)",
			event.EventName(), ctx.Depth, ctx.MaxDepth, ctx.SourceRuleID)
		return
	}

	bus.mu.RLock()
	handlers, exists := bus.handlers[event.EventName()]
	if !exists || len(handlers) == 0 {
		bus.mu.RUnlock()
		return
	}
	// Copy handlers slice to release lock quickly
	handlersCopy := make([]EventHandler, len(handlers))
	copy(handlersCopy, handlers)
	bus.mu.RUnlock()

	// Dispatch asynchronously (same behavior as current ProcessEvent's go func())
	go func() {
		for _, handler := range handlersCopy {
			handler(event)
		}
	}()
}
