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
		// Use empty object as default for non-null JSONB columns if needed
		// but returning nil allows NULL in DB
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
