package services

import (
	"sync"

	"github.com/mello/backend/internal/repository"
)

// LabelService provides cached access to system labels
type LabelService struct {
	repo  *repository.SystemLabelRepository
	cache map[string]map[string]string // language -> key -> value
	mu    sync.RWMutex
}

var labelServiceInstance *LabelService
var labelServiceOnce sync.Once

// GetLabelService returns the singleton label service
func GetLabelService() *LabelService {
	labelServiceOnce.Do(func() {
		labelServiceInstance = &LabelService{
			repo:  repository.NewSystemLabelRepository(),
			cache: make(map[string]map[string]string),
		}
	})
	return labelServiceInstance
}

// Get returns a label value for the given key and language
// Falls back to default_value if no translation exists
func (s *LabelService) Get(key, language string) string {
	s.mu.RLock()
	if langCache, ok := s.cache[language]; ok {
		if value, ok := langCache[key]; ok {
			s.mu.RUnlock()
			return value
		}
	}
	s.mu.RUnlock()

	// Not in cache, load from DB
	s.loadLanguage(language)

	s.mu.RLock()
	defer s.mu.RUnlock()
	if langCache, ok := s.cache[language]; ok {
		if value, ok := langCache[key]; ok {
			return value
		}
	}
	return key // Fallback to key if not found
}

// GetAll returns all labels for a language
func (s *LabelService) GetAll(language string) map[string]string {
	s.mu.RLock()
	if langCache, ok := s.cache[language]; ok {
		// Return a copy
		result := make(map[string]string)
		for k, v := range langCache {
			result[k] = v
		}
		s.mu.RUnlock()
		return result
	}
	s.mu.RUnlock()

	// Not in cache, load from DB
	s.loadLanguage(language)

	s.mu.RLock()
	defer s.mu.RUnlock()
	if langCache, ok := s.cache[language]; ok {
		result := make(map[string]string)
		for k, v := range langCache {
			result[k] = v
		}
		return result
	}
	return make(map[string]string)
}

func (s *LabelService) loadLanguage(language string) {
	labels, err := s.repo.GetResolvedLabels(language)
	if err != nil {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache[language] = labels
}

// ClearCache clears all cached labels
func (s *LabelService) ClearCache() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache = make(map[string]map[string]string)
}
