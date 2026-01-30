package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSONMap implements sql.Scanner and driver.Valuer for JSONB support
type JSONMap map[string]interface{}

// Value Marshal
func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return json.Marshal(map[string]interface{}{})
	}
	return json.Marshal(m)
}

// Scan Unmarshal
func (m *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to unmarshal JSONB value: invalid type")
	}

	result := make(map[string]interface{})
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}
	*m = JSONMap(result)
	return nil
}

// JSONArray defines a slice that implements the sql.Scanner and driver.Valuer interfaces
type JSONArray []interface{}

func (j JSONArray) Value() (driver.Value, error) {
	if j == nil {
		return json.Marshal([]interface{}{})
	}
	return json.Marshal(j)
}

func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to unmarshal JSONB value: invalid type")
	}

	// Try unmarshal as array
	result := make([]interface{}, 0)
	if err := json.Unmarshal(bytes, &result); err == nil {
		*j = JSONArray(result)
		return nil
	}

	// If failed, try as object (handle potential '{}' from default values)
	var obj map[string]interface{}
	if err := json.Unmarshal(bytes, &obj); err == nil {
		// If it's an object, strictly we expect array, but we can tolerate empty object as empty array
		*j = JSONArray(make([]interface{}, 0))
		return nil
	}

	return errors.New("failed to unmarshal JSONB value into array or object")
}
