package conditions

import (
	"fmt"
)

// Evaluator is the main condition evaluation engine.
type Evaluator struct {
	// Context provides access to data for field resolution
	context *EvaluationContext
}

// NewEvaluator creates a new condition evaluator with the given context.
func NewEvaluator(ctx *EvaluationContext) *Evaluator {
	return &Evaluator{
		context: ctx,
	}
}

// EvaluationResult contains the result of condition evaluation.
type EvaluationResult struct {
	// Match indicates if all conditions were satisfied
	Match bool `json:"match"`

	// Details contains evaluation details for each condition
	Details []ConditionDetail `json:"details,omitempty"`

	// Error contains any error that occurred during evaluation
	Error error `json:"error,omitempty"`
}

// ConditionDetail describes the evaluation result of a single condition.
type ConditionDetail struct {
	// Field path that was evaluated
	Field string `json:"field"`

	// Operator used
	Operator OperatorType `json:"operator"`

	// Expected value
	Expected interface{} `json:"expected"`

	// Actual value found
	Actual interface{} `json:"actual"`

	// Match indicates if this condition matched
	Match bool `json:"match"`

	// Error if evaluation failed
	Error string `json:"error,omitempty"`
}

// Evaluate evaluates all conditions and returns the result.
// All conditions in the group must match (AND logic).
// For OR logic, use multiple groups.
func (e *Evaluator) Evaluate(group *ConditionGroup) EvaluationResult {
	result := EvaluationResult{
		Match:   true,
		Details: make([]ConditionDetail, 0),
	}

	if group == nil || len(group.Conditions) == 0 {
		return result
	}

	for _, condition := range group.Conditions {
		detail := e.evaluateCondition(&condition)
		result.Details = append(result.Details, detail)

		if detail.Error != "" {
			result.Error = fmt.Errorf("condition evaluation error: %s", detail.Error)
		}

		if !detail.Match {
			result.Match = false
			// Continue evaluating for complete details
		}
	}

	return result
}

// EvaluateMultipleGroups evaluates multiple condition groups with OR logic between groups.
// Each group uses AND logic internally.
// Returns true if ANY group matches.
func (e *Evaluator) EvaluateMultipleGroups(groups []*ConditionGroup) EvaluationResult {
	result := EvaluationResult{
		Match:   false,
		Details: make([]ConditionDetail, 0),
	}

	if len(groups) == 0 {
		result.Match = true
		return result
	}

	for _, group := range groups {
		groupResult := e.Evaluate(group)
		result.Details = append(result.Details, groupResult.Details...)

		if groupResult.Match {
			result.Match = true
			// Found a matching group, but continue for complete details
		}
	}

	return result
}

// evaluateCondition evaluates a single condition.
func (e *Evaluator) evaluateCondition(condition *Condition) ConditionDetail {
	// Convert string operator to OperatorType
	opType := OperatorType(condition.Operator)

	detail := ConditionDetail{
		Field:    condition.Field,
		Operator: opType,
		Expected: condition.Value,
	}

	// Resolve the field value from context
	actualValue, exists := e.resolveFieldValue(condition.Field)
	detail.Actual = actualValue

	// Handle special operators that check existence
	if opType == OpExists {
		detail.Match = exists
		return detail
	}

	if opType == OpNotExists {
		detail.Match = !exists
		return detail
	}

	// For other operators, field must exist unless checking for empty/false
	if !exists && opType != OpIsEmpty && opType != OpIsFalse {
		detail.Match = false
		return detail
	}

	// Get the operator function
	opFunc, ok := GetOperator(opType)
	if !ok {
		detail.Error = fmt.Sprintf("unknown operator: %s", condition.Operator)
		detail.Match = false
		return detail
	}

	// Execute the operator
	match := opFunc(actualValue, condition.Value)

	// Apply negation if specified
	if condition.Negate {
		match = !match
	}

	detail.Match = match
	return detail
}

// resolveFieldValue resolves the value for a field path from the context.
func (e *Evaluator) resolveFieldValue(field string) (interface{}, bool) {
	if e.context == nil {
		return nil, false
	}

	// Check direct data first
	if e.context.Data != nil {
		if val, ok := ResolveField(e.context.Data, field); ok {
			return val, true
		}
	}

	// Check card data
	if e.context.Card != nil {
		cardData := structToMap(e.context.Card)
		if val, ok := ResolveField(cardData, stripPrefix(field, "card.")); ok {
			return val, true
		}
	}

	// Check list data
	if e.context.List != nil {
		listData := structToMap(e.context.List)
		if val, ok := ResolveField(listData, stripPrefix(field, "list.")); ok {
			return val, true
		}
	}

	// Check board data
	if e.context.Board != nil {
		boardData := structToMap(e.context.Board)
		if val, ok := ResolveField(boardData, stripPrefix(field, "board.")); ok {
			return val, true
		}
	}

	// Check user data
	if e.context.User != nil {
		userData := structToMap(e.context.User)
		if val, ok := ResolveField(userData, stripPrefix(field, "user.")); ok {
			return val, true
		}
	}

	return nil, false
}

// stripPrefix removes a prefix from a string if present.
func stripPrefix(s, prefix string) string {
	if len(s) >= len(prefix) && s[:len(prefix)] == prefix {
		return s[len(prefix):]
	}
	return s
}

// structToMap converts a struct to a map[string]interface{}.
// This is a simplified version - in production, use reflection or JSON marshaling.
func structToMap(v interface{}) map[string]interface{} {
	if m, ok := v.(map[string]interface{}); ok {
		return m
	}

	// For complex structs, we'd use reflection or JSON
	// For now, return empty map
	return make(map[string]interface{})
}

// EvaluateSimple is a convenience function for simple condition evaluation.
func EvaluateSimple(data map[string]interface{}, conditions []Condition) bool {
	ctx := &EvaluationContext{Data: data}
	evaluator := NewEvaluator(ctx)

	group := &ConditionGroup{
		Logic:      LogicalAnd,
		Conditions: conditions,
	}

	result := evaluator.Evaluate(group)
	return result.Match
}

// ConditionBuilder provides a fluent API for building conditions.
type ConditionBuilder struct {
	conditions []Condition
}

// NewConditionBuilder creates a new condition builder.
func NewConditionBuilder() *ConditionBuilder {
	return &ConditionBuilder{
		conditions: make([]Condition, 0),
	}
}

// Field starts building a condition for a field.
func (b *ConditionBuilder) Field(path string) *FieldConditionBuilder {
	return &FieldConditionBuilder{
		parent: b,
		field:  path,
	}
}

// Build returns the built conditions.
func (b *ConditionBuilder) Build() []Condition {
	return b.conditions
}

// BuildGroup returns the conditions as a ConditionGroup.
func (b *ConditionBuilder) BuildGroup() *ConditionGroup {
	return &ConditionGroup{
		Logic:      LogicalAnd,
		Conditions: b.conditions,
	}
}

// FieldConditionBuilder builds a condition for a specific field.
type FieldConditionBuilder struct {
	parent *ConditionBuilder
	field  string
}

// Equals adds an equals condition.
func (f *FieldConditionBuilder) Equals(value interface{}) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpEquals),
		Value:    value,
	})
	return f.parent
}

// NotEquals adds a not equals condition.
func (f *FieldConditionBuilder) NotEquals(value interface{}) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpNotEquals),
		Value:    value,
	})
	return f.parent
}

// Contains adds a contains condition.
func (f *FieldConditionBuilder) Contains(value string) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpContains),
		Value:    value,
	})
	return f.parent
}

// GreaterThan adds a greater than condition.
func (f *FieldConditionBuilder) GreaterThan(value interface{}) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpGreaterThan),
		Value:    value,
	})
	return f.parent
}

// LessThan adds a less than condition.
func (f *FieldConditionBuilder) LessThan(value interface{}) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpLessThan),
		Value:    value,
	})
	return f.parent
}

// In adds an in condition.
func (f *FieldConditionBuilder) In(values ...interface{}) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpIn),
		Value:    values,
	})
	return f.parent
}

// IsEmpty adds an is empty condition.
func (f *FieldConditionBuilder) IsEmpty() *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpIsEmpty),
		Value:    nil,
	})
	return f.parent
}

// Exists adds an exists condition.
func (f *FieldConditionBuilder) Exists() *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpExists),
		Value:    nil,
	})
	return f.parent
}

// Matches adds a regex match condition.
func (f *FieldConditionBuilder) Matches(pattern string) *ConditionBuilder {
	f.parent.conditions = append(f.parent.conditions, Condition{
		Field:    f.field,
		Operator: string(OpMatches),
		Value:    pattern,
	})
	return f.parent
}
