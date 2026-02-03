package conditions

import (
	"regexp"
	"strconv"
	"strings"
)

// ResolveField resolves a field path from a data map.
// Supports dot notation and array indexing.
//
// Examples:
//   - "card.name" → data["card"]["name"]
//   - "card.labels[0].name" → data["card"]["labels"][0]["name"]
//   - "card.list.position" → data["card"]["list"]["position"]
func ResolveField(data map[string]interface{}, path string) (interface{}, bool) {
	if data == nil || path == "" {
		return nil, false
	}

	parts := parsePath(path)
	if len(parts) == 0 {
		return nil, false
	}

	var current interface{} = data

	for _, part := range parts {
		switch v := current.(type) {
		case map[string]interface{}:
			val, ok := v[part.Name]
			if !ok {
				return nil, false
			}

			if part.IsArrayAccess {
				current = accessArray(val, part.Index)
				if current == nil {
					return nil, false
				}
			} else {
				current = val
			}

		case []interface{}:
			// Direct array access without field name
			if part.IsArrayAccess {
				current = accessArray(v, part.Index)
				if current == nil {
					return nil, false
				}
			} else {
				return nil, false
			}

		default:
			return nil, false
		}
	}

	return current, true
}

// parsePath parses a field path into parts.
// Example: "card.labels[0].name" → [{card, -1, false}, {labels, 0, true}, {name, -1, false}]
func parsePath(path string) []PathPart {
	var parts []PathPart

	// Split by dots, but handle array notation
	segments := strings.Split(path, ".")

	for _, segment := range segments {
		if segment == "" {
			continue
		}

		part := PathPart{Index: -1}

		// Check for array access notation: field[0]
		arrayPattern := regexp.MustCompile(`^(.+)\[(\d+)\]$`)
		if matches := arrayPattern.FindStringSubmatch(segment); matches != nil {
			part.Name = matches[1]
			idx, _ := strconv.Atoi(matches[2])
			part.Index = idx
			part.IsArrayAccess = true
		} else {
			part.Name = segment
		}

		parts = append(parts, part)
	}

	return parts
}

// accessArray accesses an array element by index.
func accessArray(data interface{}, index int) interface{} {
	if index < 0 {
		return nil
	}

	switch v := data.(type) {
	case []interface{}:
		if index < len(v) {
			return v[index]
		}
	case []map[string]interface{}:
		if index < len(v) {
			return v[index]
		}
	case []string:
		if index < len(v) {
			return v[index]
		}
	}

	return nil
}

// SetField sets a value at a field path in a data map.
// Creates intermediate maps if they don't exist.
func SetField(data map[string]interface{}, path string, value interface{}) bool {
	if data == nil || path == "" {
		return false
	}

	parts := parsePath(path)
	if len(parts) == 0 {
		return false
	}

	current := data

	// Navigate to the parent of the target field
	for i := 0; i < len(parts)-1; i++ {
		part := parts[i]

		if part.IsArrayAccess {
			// Can't create arrays automatically
			val, ok := current[part.Name]
			if !ok {
				return false
			}

			arr := accessArray(val, part.Index)
			if m, ok := arr.(map[string]interface{}); ok {
				current = m
			} else {
				return false
			}
		} else {
			val, ok := current[part.Name]
			if !ok {
				// Create intermediate map
				newMap := make(map[string]interface{})
				current[part.Name] = newMap
				current = newMap
			} else if m, ok := val.(map[string]interface{}); ok {
				current = m
			} else {
				return false
			}
		}
	}

	// Set the final field
	lastPart := parts[len(parts)-1]
	if lastPart.IsArrayAccess {
		// Array set - more complex, skip for now
		return false
	}

	current[lastPart.Name] = value
	return true
}

// FieldExists checks if a field path exists in the data map.
func FieldExists(data map[string]interface{}, path string) bool {
	_, exists := ResolveField(data, path)
	return exists
}

// GetFieldsAtPath returns all field names at a given path.
// Example: GetFieldsAtPath(data, "card") might return ["name", "description", "labels"]
func GetFieldsAtPath(data map[string]interface{}, path string) []string {
	var result []string

	if path == "" {
		for k := range data {
			result = append(result, k)
		}
		return result
	}

	val, ok := ResolveField(data, path)
	if !ok {
		return result
	}

	if m, ok := val.(map[string]interface{}); ok {
		for k := range m {
			result = append(result, k)
		}
	}

	return result
}

// FlattenFields returns all possible field paths in the data.
// Useful for autocomplete in the UI.
func FlattenFields(data map[string]interface{}, prefix string) []string {
	var result []string

	for key, value := range data {
		path := key
		if prefix != "" {
			path = prefix + "." + key
		}

		result = append(result, path)

		switch v := value.(type) {
		case map[string]interface{}:
			// Recurse into nested maps
			nested := FlattenFields(v, path)
			result = append(result, nested...)

		case []interface{}:
			// Add array notation for first element
			if len(v) > 0 {
				if m, ok := v[0].(map[string]interface{}); ok {
					nested := FlattenFields(m, path+"[0]")
					result = append(result, nested...)
				}
			}
		}
	}

	return result
}
