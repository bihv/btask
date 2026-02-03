// Package conditions provides a unified condition evaluation engine for automation rules.
// It supports various operators and field resolution using dot notation.
//
// Architecture:
//
//	┌─────────────────────────────────────────────────────────────────┐
//	│                    CONDITION ENGINE                             │
//	├─────────────────────────────────────────────────────────────────┤
//	│                                                                 │
//	│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
//	│  │  Condition  │    │  Operators  │    │   Field Resolver    │ │
//	│  │   struct    │───▶│  Registry   │◀───│   (dot notation)    │ │
//	│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
//	│         │                  │                     │             │
//	│         ▼                  ▼                     ▼             │
//	│  ┌─────────────────────────────────────────────────────────┐  │
//	│  │                    Evaluator                             │  │
//	│  │   Evaluate(conditions, context) → bool                  │  │
//	│  └─────────────────────────────────────────────────────────┘  │
//	│                                                                │
//	└─────────────────────────────────────────────────────────────────┘
//
// Usage:
//
//	evaluator := conditions.NewEvaluator()
//	result := evaluator.Evaluate([]Condition{
//	    {Field: "card.list.name", Operator: "equals", Value: "Done"},
//	}, context)
package conditions

// Condition represents a single condition in an automation rule.
type Condition struct {
	// Field is the path to the value to check.
	// Supports dot notation: "card.list.name", "card.labels[0].color"
	Field string `json:"field"`

	// Operator is the comparison operator to use.
	// Examples: "equals", "not_equals", "contains", "gt", "lt", "in", "matches"
	Operator string `json:"operator"`

	// Value is the expected value to compare against.
	// Type depends on the operator.
	Value interface{} `json:"value"`

	// Negate inverts the result of the condition.
	Negate bool `json:"negate,omitempty"`
}

// ConditionGroup represents a group of conditions with a logical operator.
type ConditionGroup struct {
	// Logic is the logical operator: "and" or "or"
	Logic string `json:"logic"` // "and" | "or"

	// Conditions is the list of conditions in this group.
	Conditions []Condition `json:"conditions"`

	// Groups is nested condition groups (for complex logic).
	Groups []ConditionGroup `json:"groups,omitempty"`
}

// Logical operators for condition groups.
const (
	LogicalAnd = "and"
	LogicalOr  = "or"
)

// ============================================================================
// OPERATOR TYPES
// ============================================================================

// OperatorType defines the type of operator.
type OperatorType string

const (
	// Comparison Operators
	OpEquals      OperatorType = "equals"
	OpNotEquals   OperatorType = "not_equals"
	OpContains    OperatorType = "contains"
	OpNotContains OperatorType = "not_contains"
	OpStartsWith  OperatorType = "starts_with"
	OpEndsWith    OperatorType = "ends_with"
	OpMatches     OperatorType = "matches" // Regex

	// Numeric Operators
	OpGreaterThan    OperatorType = "gt"
	OpGreaterOrEqual OperatorType = "gte"
	OpLessThan       OperatorType = "lt"
	OpLessOrEqual    OperatorType = "lte"

	// Collection Operators
	OpIn       OperatorType = "in"
	OpNotIn    OperatorType = "not_in"
	OpIsEmpty  OperatorType = "is_empty"
	OpNotEmpty OperatorType = "not_empty"

	// Existence Operators
	OpExists    OperatorType = "exists"
	OpNotExists OperatorType = "not_exists"

	// Boolean Operators
	OpIsTrue  OperatorType = "is_true"
	OpIsFalse OperatorType = "is_false"
)

// OperatorInfo provides metadata about an operator.
type OperatorInfo struct {
	ID           OperatorType `json:"id"`
	Type         OperatorType `json:"type"` // Alias for ID for compatibility
	Name         string       `json:"name"`
	Label        string       `json:"label"` // Alias for Name
	Description  string       `json:"description"`
	ValueType    string       `json:"value_type"`    // "string", "number", "array", "boolean", "none"
	AcceptsValue bool         `json:"accepts_value"` // Whether operator requires a value
}

// GetOperatorInfos returns information about all supported operators.
func GetOperatorInfos() []OperatorInfo {
	return []OperatorInfo{
		{ID: OpEquals, Type: OpEquals, Name: "Equals", Label: "Equals", Description: "Value equals the specified value", ValueType: "any", AcceptsValue: true},
		{ID: OpNotEquals, Type: OpNotEquals, Name: "Does not equal", Label: "Not Equals", Description: "Value does not equal the specified value", ValueType: "any", AcceptsValue: true},
		{ID: OpContains, Type: OpContains, Name: "Contains", Label: "Contains", Description: "Value contains the specified text", ValueType: "string", AcceptsValue: true},
		{ID: OpNotContains, Type: OpNotContains, Name: "Does not contain", Label: "Not Contains", Description: "Value does not contain the specified text", ValueType: "string", AcceptsValue: true},
		{ID: OpStartsWith, Type: OpStartsWith, Name: "Starts with", Label: "Starts With", Description: "Value starts with the specified text", ValueType: "string", AcceptsValue: true},
		{ID: OpEndsWith, Type: OpEndsWith, Name: "Ends with", Label: "Ends With", Description: "Value ends with the specified text", ValueType: "string", AcceptsValue: true},
		{ID: OpMatches, Type: OpMatches, Name: "Matches pattern", Label: "Matches Regex", Description: "Value matches the regex pattern", ValueType: "string", AcceptsValue: true},
		{ID: OpGreaterThan, Type: OpGreaterThan, Name: "Greater than", Label: "Greater Than", Description: "Value is greater than the specified number", ValueType: "number", AcceptsValue: true},
		{ID: OpGreaterOrEqual, Type: OpGreaterOrEqual, Name: "Greater than or equal", Label: "Greater Than or Equal", Description: "Value is greater than or equal to the specified number", ValueType: "number", AcceptsValue: true},
		{ID: OpLessThan, Type: OpLessThan, Name: "Less than", Label: "Less Than", Description: "Value is less than the specified number", ValueType: "number", AcceptsValue: true},
		{ID: OpLessOrEqual, Type: OpLessOrEqual, Name: "Less than or equal", Label: "Less Than or Equal", Description: "Value is less than or equal to the specified number", ValueType: "number", AcceptsValue: true},
		{ID: OpIn, Type: OpIn, Name: "Is in list", Label: "In", Description: "Value is one of the specified values", ValueType: "array", AcceptsValue: true},
		{ID: OpNotIn, Type: OpNotIn, Name: "Is not in list", Label: "Not In", Description: "Value is not one of the specified values", ValueType: "array", AcceptsValue: true},
		{ID: OpIsEmpty, Type: OpIsEmpty, Name: "Is empty", Label: "Is Empty", Description: "Value is empty or null", ValueType: "none", AcceptsValue: false},
		{ID: OpNotEmpty, Type: OpNotEmpty, Name: "Is not empty", Label: "Is Not Empty", Description: "Value is not empty", ValueType: "none", AcceptsValue: false},
		{ID: OpExists, Type: OpExists, Name: "Exists", Label: "Exists", Description: "Field exists", ValueType: "none", AcceptsValue: false},
		{ID: OpNotExists, Type: OpNotExists, Name: "Does not exist", Label: "Not Exists", Description: "Field does not exist", ValueType: "none", AcceptsValue: false},
		{ID: OpIsTrue, Type: OpIsTrue, Name: "Is true", Label: "Is True", Description: "Value is true", ValueType: "none", AcceptsValue: false},
		{ID: OpIsFalse, Type: OpIsFalse, Name: "Is false", Label: "Is False", Description: "Value is false", ValueType: "none", AcceptsValue: false},
	}
}

// ============================================================================
// FIELD PATH TYPES
// ============================================================================

// FieldPath represents a parsed field path.
type FieldPath struct {
	Parts []PathPart
}

// PathPart represents a single part of a field path.
type PathPart struct {
	// Name is the field name.
	Name string

	// Index is the array index (-1 if not an array access).
	Index int

	// IsArrayAccess indicates if this part includes array indexing.
	IsArrayAccess bool
}

// String returns the string representation of the field path.
func (fp FieldPath) String() string {
	result := ""
	for i, part := range fp.Parts {
		if i > 0 {
			result += "."
		}
		result += part.Name
		if part.IsArrayAccess {
			result += "[" + string(rune('0'+part.Index)) + "]"
		}
	}
	return result
}

// ============================================================================
// EVALUATION CONTEXT
// ============================================================================

// EvaluationContext provides the context for condition evaluation.
type EvaluationContext struct {
	// Data is the root object for field resolution.
	Data map[string]interface{}

	// Card provides quick access to card-related fields.
	Card map[string]interface{}

	// List provides quick access to list-related fields.
	List map[string]interface{}

	// Board provides quick access to board-related fields.
	Board map[string]interface{}

	// User provides quick access to user-related fields (the triggering user).
	User map[string]interface{}
}

// NewEvaluationContext creates an EvaluationContext from a generic data map.
func NewEvaluationContext(data map[string]interface{}) *EvaluationContext {
	ctx := &EvaluationContext{
		Data: data,
	}

	// Extract common objects
	if card, ok := data["card"].(map[string]interface{}); ok {
		ctx.Card = card
	}
	if list, ok := data["list"].(map[string]interface{}); ok {
		ctx.List = list
	}
	if board, ok := data["board"].(map[string]interface{}); ok {
		ctx.Board = board
	}
	if user, ok := data["user"].(map[string]interface{}); ok {
		ctx.User = user
	}

	return ctx
}

// Get retrieves a value from the context using a field path.
func (ctx *EvaluationContext) Get(path string) (interface{}, bool) {
	// Delegate to field resolver
	return ResolveField(ctx.Data, path)
}
