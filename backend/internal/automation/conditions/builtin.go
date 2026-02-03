package conditions

// InitConditionEngine initializes the condition engine.
// This is called during application startup.
func InitConditionEngine() {
	// Register any custom operators here if needed in the future
	// Currently all operators are registered by default in operators.go
}

// ValidateCondition validates a condition configuration.
func ValidateCondition(condition *Condition) error {
	if condition.Field == "" {
		return &ConditionError{
			Code:    "EMPTY_FIELD",
			Message: "condition field cannot be empty",
		}
	}

	if condition.Operator == "" {
		return &ConditionError{
			Code:    "EMPTY_OPERATOR",
			Message: "condition operator cannot be empty",
		}
	}

	// Check if operator exists
	if _, exists := GetOperator(OperatorType(condition.Operator)); !exists {
		return &ConditionError{
			Code:    "UNKNOWN_OPERATOR",
			Message: "unknown operator: " + condition.Operator,
		}
	}

	// Validate value based on operator
	op := OperatorType(condition.Operator)
	switch op {
	case OpExists, OpNotExists, OpIsEmpty, OpNotEmpty, OpIsTrue, OpIsFalse:
		// These operators don't require a value
	default:
		if condition.Value == nil && op != OpEquals {
			return &ConditionError{
				Code:    "MISSING_VALUE",
				Message: "condition value is required for operator: " + condition.Operator,
			}
		}
	}

	return nil
}

// ValidateConditionGroup validates a condition group.
func ValidateConditionGroup(group *ConditionGroup) []error {
	var errors []error

	if group == nil {
		return errors
	}

	for i, condition := range group.Conditions {
		if err := ValidateCondition(&condition); err != nil {
			errors = append(errors, &ConditionError{
				Code:    "CONDITION_ERROR",
				Message: err.Error(),
				Index:   i,
			})
		}
	}

	return errors
}

// ConditionError represents a condition validation error.
type ConditionError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Index   int    `json:"index,omitempty"`
}

func (e *ConditionError) Error() string {
	return e.Message
}

// GetAvailableOperators returns all available operators with their metadata.
// This delegates to GetOperatorInfos() in types.go for consistency.
func GetAvailableOperators() []OperatorInfo {
	return GetOperatorInfos()
}

// GetAvailableFields returns a list of available fields for conditions based on context type.
func GetAvailableFields(contextType string) []FieldInfo {
	switch contextType {
	case "card":
		return []FieldInfo{
			{Path: "card.name", Type: "string", Label: "Card Name"},
			{Path: "card.description", Type: "string", Label: "Card Description"},
			{Path: "card.position", Type: "number", Label: "Card Position"},
			{Path: "card.is_archived", Type: "boolean", Label: "Is Archived"},
			{Path: "card.due_date", Type: "date", Label: "Due Date"},
			{Path: "card.start_date", Type: "date", Label: "Start Date"},
			{Path: "card.cover_color", Type: "string", Label: "Cover Color"},
			{Path: "card.list.name", Type: "string", Label: "List Name"},
			{Path: "card.list.position", Type: "number", Label: "List Position"},
			{Path: "card.labels", Type: "array", Label: "Labels"},
			{Path: "card.members", Type: "array", Label: "Members"},
			{Path: "card.checklist_items_count", Type: "number", Label: "Checklist Items Count"},
			{Path: "card.comments_count", Type: "number", Label: "Comments Count"},
			{Path: "card.attachments_count", Type: "number", Label: "Attachments Count"},
		}

	case "list":
		return []FieldInfo{
			{Path: "list.name", Type: "string", Label: "List Name"},
			{Path: "list.position", Type: "number", Label: "List Position"},
			{Path: "list.is_archived", Type: "boolean", Label: "Is Archived"},
			{Path: "list.cards_count", Type: "number", Label: "Cards Count"},
		}

	case "board":
		return []FieldInfo{
			{Path: "board.name", Type: "string", Label: "Board Name"},
			{Path: "board.description", Type: "string", Label: "Board Description"},
			{Path: "board.visibility", Type: "string", Label: "Visibility"},
		}

	case "user":
		return []FieldInfo{
			{Path: "user.id", Type: "string", Label: "User ID"},
			{Path: "user.email", Type: "string", Label: "User Email"},
			{Path: "user.name", Type: "string", Label: "User Name"},
		}

	default:
		return []FieldInfo{}
	}
}

// FieldInfo contains metadata about a field.
type FieldInfo struct {
	Path  string `json:"path"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

// GetConditionSchema returns the JSON schema for conditions.
// This can be used by the frontend to build a dynamic condition builder UI.
func GetConditionSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"field": map[string]interface{}{
				"type":        "string",
				"description": "The field path to evaluate (e.g., 'card.name', 'list.position')",
			},
			"operator": map[string]interface{}{
				"type":        "string",
				"description": "The comparison operator",
				"enum": []string{
					"equals", "not_equals", "contains", "not_contains",
					"starts_with", "ends_with", "matches",
					"gt", "gte", "lt", "lte",
					"in", "not_in",
					"is_empty", "not_empty", "exists", "not_exists",
					"is_true", "is_false",
				},
			},
			"value": map[string]interface{}{
				"description": "The value to compare against",
			},
		},
		"required": []string{"field", "operator"},
	}
}
