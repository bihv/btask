package events

import "github.com/google/uuid"

// ============================================================================
// EXECUTION CONTEXT - Recursion guard (Salesforce-style)
// ============================================================================

const DefaultMaxDepth = 5

// ExecutionContext tracks the execution chain to prevent infinite trigger loops.
// Similar to Salesforce's Trigger.isExecuting and recursion depth tracking.
type ExecutionContext struct {
	// IsAutomationExecution is true when the event originates from an automation action
	// (not from a direct user action).
	IsAutomationExecution bool

	// SourceRuleID identifies which automation rule caused this event (for debugging).
	SourceRuleID uuid.UUID

	// Depth tracks the current recursion level.
	// User action = 0, first automation cascade = 1, second = 2, etc.
	Depth int

	// MaxDepth is the maximum allowed recursion depth. Default: 5.
	MaxDepth int

	// ProcessedRules tracks which rules have already been executed in this chain
	// to prevent the same rule from firing twice in one cascade.
	ProcessedRules map[uuid.UUID]bool
}

// NewUserContext creates an ExecutionContext for a direct user action (Depth=0).
func NewUserContext() ExecutionContext {
	return ExecutionContext{
		IsAutomationExecution: false,
		Depth:                 0,
		MaxDepth:              DefaultMaxDepth,
		ProcessedRules:        make(map[uuid.UUID]bool),
	}
}

// NewAutomationContext creates an ExecutionContext for an automation-triggered action.
// It increments the depth from the parent context.
func NewAutomationContext(ruleID uuid.UUID, parent ExecutionContext) ExecutionContext {
	// Copy processed rules from parent
	processed := make(map[uuid.UUID]bool, len(parent.ProcessedRules)+1)
	for k, v := range parent.ProcessedRules {
		processed[k] = v
	}
	processed[ruleID] = true

	return ExecutionContext{
		IsAutomationExecution: true,
		SourceRuleID:          ruleID,
		Depth:                 parent.Depth + 1,
		MaxDepth:              parent.MaxDepth,
		ProcessedRules:        processed,
	}
}

// CanCascade returns true if the current depth allows further trigger cascading.
func (ctx ExecutionContext) CanCascade() bool {
	return ctx.Depth < ctx.MaxDepth
}

// HasProcessedRule checks if a specific rule has already been executed in this chain.
func (ctx ExecutionContext) HasProcessedRule(ruleID uuid.UUID) bool {
	return ctx.ProcessedRules[ruleID]
}
