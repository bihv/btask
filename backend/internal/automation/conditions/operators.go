package conditions

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
)

// OperatorFunc is the function signature for operator implementations.
type OperatorFunc func(fieldValue interface{}, conditionValue interface{}) bool

// operatorRegistry holds all registered operators.
var operatorRegistry = map[OperatorType]OperatorFunc{
	OpEquals:         opEquals,
	OpNotEquals:      opNotEquals,
	OpContains:       opContains,
	OpNotContains:    opNotContains,
	OpStartsWith:     opStartsWith,
	OpEndsWith:       opEndsWith,
	OpMatches:        opMatches,
	OpGreaterThan:    opGreaterThan,
	OpGreaterOrEqual: opGreaterOrEqual,
	OpLessThan:       opLessThan,
	OpLessOrEqual:    opLessOrEqual,
	OpIn:             opIn,
	OpNotIn:          opNotIn,
	OpIsEmpty:        opIsEmpty,
	OpNotEmpty:       opNotEmpty,
	OpExists:         opExists,
	OpNotExists:      opNotExists,
	OpIsTrue:         opIsTrue,
	OpIsFalse:        opIsFalse,
}

// GetOperator returns the operator function for a given operator type.
func GetOperator(op OperatorType) (OperatorFunc, bool) {
	fn, ok := operatorRegistry[op]
	return fn, ok
}

// RegisterOperator allows registering custom operators.
func RegisterOperator(op OperatorType, fn OperatorFunc) {
	operatorRegistry[op] = fn
}

// ============================================================================
// COMPARISON OPERATORS
// ============================================================================

// opEquals checks if two values are equal.
func opEquals(fieldValue interface{}, conditionValue interface{}) bool {
	if fieldValue == nil && conditionValue == nil {
		return true
	}
	if fieldValue == nil || conditionValue == nil {
		return false
	}

	// Try string comparison first
	fStr := toString(fieldValue)
	cStr := toString(conditionValue)
	if strings.EqualFold(fStr, cStr) {
		return true
	}

	// Try numeric comparison
	if fNum, ok := toFloat64(fieldValue); ok {
		if cNum, ok := toFloat64(conditionValue); ok {
			return fNum == cNum
		}
	}

	// Deep equal for complex types
	return reflect.DeepEqual(fieldValue, conditionValue)
}

// opNotEquals checks if two values are not equal.
func opNotEquals(fieldValue interface{}, conditionValue interface{}) bool {
	return !opEquals(fieldValue, conditionValue)
}

// opContains checks if a string contains a substring.
func opContains(fieldValue interface{}, conditionValue interface{}) bool {
	fStr := toString(fieldValue)
	cStr := toString(conditionValue)
	return strings.Contains(strings.ToLower(fStr), strings.ToLower(cStr))
}

// opNotContains checks if a string does not contain a substring.
func opNotContains(fieldValue interface{}, conditionValue interface{}) bool {
	return !opContains(fieldValue, conditionValue)
}

// opStartsWith checks if a string starts with a prefix.
func opStartsWith(fieldValue interface{}, conditionValue interface{}) bool {
	fStr := strings.ToLower(toString(fieldValue))
	cStr := strings.ToLower(toString(conditionValue))
	return strings.HasPrefix(fStr, cStr)
}

// opEndsWith checks if a string ends with a suffix.
func opEndsWith(fieldValue interface{}, conditionValue interface{}) bool {
	fStr := strings.ToLower(toString(fieldValue))
	cStr := strings.ToLower(toString(conditionValue))
	return strings.HasSuffix(fStr, cStr)
}

// opMatches checks if a string matches a regex pattern.
func opMatches(fieldValue interface{}, conditionValue interface{}) bool {
	fStr := toString(fieldValue)
	pattern := toString(conditionValue)

	re, err := regexp.Compile(pattern)
	if err != nil {
		return false
	}

	return re.MatchString(fStr)
}

// ============================================================================
// NUMERIC OPERATORS
// ============================================================================

// opGreaterThan checks if field value is greater than condition value.
func opGreaterThan(fieldValue interface{}, conditionValue interface{}) bool {
	fNum, fOk := toFloat64(fieldValue)
	cNum, cOk := toFloat64(conditionValue)

	if !fOk || !cOk {
		return false
	}

	return fNum > cNum
}

// opGreaterOrEqual checks if field value is greater than or equal to condition value.
func opGreaterOrEqual(fieldValue interface{}, conditionValue interface{}) bool {
	fNum, fOk := toFloat64(fieldValue)
	cNum, cOk := toFloat64(conditionValue)

	if !fOk || !cOk {
		return false
	}

	return fNum >= cNum
}

// opLessThan checks if field value is less than condition value.
func opLessThan(fieldValue interface{}, conditionValue interface{}) bool {
	fNum, fOk := toFloat64(fieldValue)
	cNum, cOk := toFloat64(conditionValue)

	if !fOk || !cOk {
		return false
	}

	return fNum < cNum
}

// opLessOrEqual checks if field value is less than or equal to condition value.
func opLessOrEqual(fieldValue interface{}, conditionValue interface{}) bool {
	fNum, fOk := toFloat64(fieldValue)
	cNum, cOk := toFloat64(conditionValue)

	if !fOk || !cOk {
		return false
	}

	return fNum <= cNum
}

// ============================================================================
// COLLECTION OPERATORS
// ============================================================================

// opIn checks if field value is in the condition value list.
func opIn(fieldValue interface{}, conditionValue interface{}) bool {
	// conditionValue should be a slice/array
	list, ok := toSlice(conditionValue)
	if !ok {
		// If not a list, treat as single value comparison
		return opEquals(fieldValue, conditionValue)
	}

	for _, item := range list {
		if opEquals(fieldValue, item) {
			return true
		}
	}

	return false
}

// opNotIn checks if field value is not in the condition value list.
func opNotIn(fieldValue interface{}, conditionValue interface{}) bool {
	return !opIn(fieldValue, conditionValue)
}

// opIsEmpty checks if a value is empty (nil, empty string, empty slice).
func opIsEmpty(fieldValue interface{}, conditionValue interface{}) bool {
	if fieldValue == nil {
		return true
	}

	// String check
	if str, ok := fieldValue.(string); ok {
		return strings.TrimSpace(str) == ""
	}

	// Slice check
	v := reflect.ValueOf(fieldValue)
	if v.Kind() == reflect.Slice || v.Kind() == reflect.Array {
		return v.Len() == 0
	}

	// Map check
	if v.Kind() == reflect.Map {
		return v.Len() == 0
	}

	return false
}

// opNotEmpty checks if a value is not empty.
func opNotEmpty(fieldValue interface{}, conditionValue interface{}) bool {
	return !opIsEmpty(fieldValue, conditionValue)
}

// ============================================================================
// EXISTENCE OPERATORS
// ============================================================================

// opExists checks if a field exists (not nil).
func opExists(fieldValue interface{}, conditionValue interface{}) bool {
	return fieldValue != nil
}

// opNotExists checks if a field does not exist (is nil).
func opNotExists(fieldValue interface{}, conditionValue interface{}) bool {
	return fieldValue == nil
}

// ============================================================================
// BOOLEAN OPERATORS
// ============================================================================

// opIsTrue checks if a value is true.
func opIsTrue(fieldValue interface{}, conditionValue interface{}) bool {
	return toBool(fieldValue)
}

// opIsFalse checks if a value is false.
func opIsFalse(fieldValue interface{}, conditionValue interface{}) bool {
	return !toBool(fieldValue)
}

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

// toString converts a value to string.
func toString(v interface{}) string {
	if v == nil {
		return ""
	}

	switch val := v.(type) {
	case string:
		return val
	case fmt.Stringer:
		return val.String()
	default:
		return fmt.Sprintf("%v", v)
	}
}

// toFloat64 converts a value to float64.
func toFloat64(v interface{}) (float64, bool) {
	if v == nil {
		return 0, false
	}

	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int8:
		return float64(val), true
	case int16:
		return float64(val), true
	case int32:
		return float64(val), true
	case int64:
		return float64(val), true
	case uint:
		return float64(val), true
	case uint8:
		return float64(val), true
	case uint16:
		return float64(val), true
	case uint32:
		return float64(val), true
	case uint64:
		return float64(val), true
	case string:
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}

// toBool converts a value to bool.
func toBool(v interface{}) bool {
	if v == nil {
		return false
	}

	switch val := v.(type) {
	case bool:
		return val
	case string:
		lower := strings.ToLower(val)
		return lower == "true" || lower == "1" || lower == "yes"
	case int, int8, int16, int32, int64:
		return reflect.ValueOf(val).Int() != 0
	case uint, uint8, uint16, uint32, uint64:
		return reflect.ValueOf(val).Uint() != 0
	case float32, float64:
		return reflect.ValueOf(val).Float() != 0
	default:
		return false
	}
}

// toSlice converts a value to a slice of interfaces.
func toSlice(v interface{}) ([]interface{}, bool) {
	if v == nil {
		return nil, false
	}

	// Already a slice of interfaces
	if slice, ok := v.([]interface{}); ok {
		return slice, true
	}

	// Try reflection for other slice types
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Slice && rv.Kind() != reflect.Array {
		return nil, false
	}

	result := make([]interface{}, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		result[i] = rv.Index(i).Interface()
	}
	return result, true
}
