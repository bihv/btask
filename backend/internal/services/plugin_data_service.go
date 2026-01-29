package services

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

// Plugin Data operations

func (s *PluginService) SetPluginData(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID, key string, value map[string]interface{}) error {
	data := &models.PluginData{
		PluginID:       pluginID,
		InstallationID: installationID,
		Scope:          scope,
		EntityID:       entityID,
		Key:            key,
		Value:          value,
		Visibility:     "private",
	}

	err := s.repo.SetData(data)
	if err != nil {
		logger.Error("Failed to set plugin data",
			zap.String("plugin_id", pluginID.String()),
			zap.String("scope", scope),
			zap.String("entity_id", entityID.String()),
			zap.String("key", key),
			zap.Error(err),
		)
		return err
	}

	logger.Debug("Plugin data set",
		zap.String("plugin_id", pluginID.String()),
		zap.String("scope", scope),
		zap.String("entity_id", entityID.String()),
		zap.String("key", key),
	)

	return nil
}

func (s *PluginService) GetPluginData(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID, key string) (*models.PluginData, error) {
	return s.repo.GetData(pluginID, installationID, scope, entityID, key)
}

func (s *PluginService) GetPluginDataByScope(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID) ([]models.PluginData, error) {
	return s.repo.GetDataByScope(pluginID, installationID, scope, entityID)
}

func (s *PluginService) DeletePluginData(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID, key string) error {
	return s.repo.DeleteData(pluginID, installationID, scope, entityID, key)
}

// Data cleanup job
func (s *PluginService) CleanupExpiredData() error {
	retentions, err := s.repo.FindExpiredData(100)
	if err != nil {
		logger.Error("Failed to find expired plugin data", zap.Error(err))
		return err
	}

	logger.Info("Starting plugin data cleanup", zap.Int("count", len(retentions)))

	deletedCount := 0
	for _, retention := range retentions {
		if err := s.repo.DeletePluginData(retention.InstallationID); err != nil {
			logger.Error("Failed to delete data for installation",
				zap.String("installation_id", retention.InstallationID.String()),
				zap.Error(err),
			)
			continue
		}
		deletedCount++
	}

	logger.Info("Plugin data cleanup completed",
		zap.Int("deleted", deletedCount),
		zap.Int("total", len(retentions)),
	)

	return nil
}
