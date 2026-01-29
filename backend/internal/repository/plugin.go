package repository

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type PluginRepository struct {
	db *gorm.DB
}

func NewPluginRepository(db *gorm.DB) *PluginRepository {
	return &PluginRepository{db: db}
}

// Plugin CRUD operations
func (r *PluginRepository) Create(plugin *models.Plugin, capabilities []string, permissions []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Create plugin
		if err := tx.Create(plugin).Error; err != nil {
			return err
		}

		// Create capabilities
		for _, cap := range capabilities {
			capability := &models.PluginCapability{
				PluginID:   plugin.ID,
				Capability: cap,
			}
			if err := tx.Create(capability).Error; err != nil {
				return err
			}
		}

		// Create permissions
		for _, perm := range permissions {
			permission := &models.PluginPermission{
				PluginID:   plugin.ID,
				Permission: perm,
			}
			if err := tx.Create(permission).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PluginRepository) FindByID(id uuid.UUID) (*models.Plugin, error) {
	var plugin models.Plugin
	err := r.db.
		Preload("Author").
		Preload("Capabilities").
		Preload("Permissions").
		First(&plugin, "id = ?", id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &plugin, err
}

func (r *PluginRepository) FindBySlug(slug string) (*models.Plugin, error) {
	var plugin models.Plugin
	err := r.db.
		Preload("Author").
		Preload("Capabilities").
		Preload("Permissions").
		First(&plugin, "slug = ?", slug).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &plugin, err
}

func (r *PluginRepository) FindAll(status string, isPublic *bool) ([]models.Plugin, error) {
	var plugins []models.Plugin
	query := r.db.Preload("Author").Preload("Capabilities").Preload("Permissions")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if isPublic != nil {
		query = query.Where("is_public = ?", *isPublic)
	}

	err := query.Order("install_count DESC, created_at DESC").Find(&plugins).Error
	return plugins, err
}

func (r *PluginRepository) FindByAuthorID(authorID uuid.UUID) ([]models.Plugin, error) {
	var plugins []models.Plugin
	err := r.db.
		Preload("Capabilities").
		Preload("Permissions").
		Where("author_id = ?", authorID).
		Order("created_at DESC").
		Find(&plugins).Error
	return plugins, err
}

func (r *PluginRepository) FindAllWithFilters(status string, search string, page, limit int) ([]models.Plugin, int64, error) {
	var plugins []models.Plugin
	var total int64

	query := r.db.Model(&models.Plugin{}).Preload("Author").Preload("Capabilities").Preload("Permissions")

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&plugins).Error
	return plugins, total, err
}

func (r *PluginRepository) Update(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&models.Plugin{}).Where("id = ?", id).Updates(updates).Error
}

func (r *PluginRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Plugin{}, "id = ?", id).Error
}

func (r *PluginRepository) UpdateCapabilities(pluginID uuid.UUID, capabilities []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing capabilities
		if err := tx.Where("plugin_id = ?", pluginID).Delete(&models.PluginCapability{}).Error; err != nil {
			return err
		}

		// Create new capabilities
		for _, cap := range capabilities {
			capability := &models.PluginCapability{
				PluginID:   pluginID,
				Capability: cap,
			}
			if err := tx.Create(capability).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PluginRepository) UpdatePermissions(pluginID uuid.UUID, permissions []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing permissions
		if err := tx.Where("plugin_id = ?", pluginID).Delete(&models.PluginPermission{}).Error; err != nil {
			return err
		}

		// Create new permissions
		for _, perm := range permissions {
			permission := &models.PluginPermission{
				PluginID:   pluginID,
				Permission: perm,
			}
			if err := tx.Create(permission).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// Installation operations
func (r *PluginRepository) Install(installation *models.PluginInstallation) error {
	return r.db.Create(installation).Error
}

func (r *PluginRepository) Uninstall(installationID uuid.UUID, retentionDays int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Mark installation as disabled
		if err := tx.Model(&models.PluginInstallation{}).
			Where("id = ?", installationID).
			Update("is_enabled", false).Error; err != nil {
			return err
		}

		// Create retention record
		retention := &models.PluginDataRetention{
			InstallationID:      installationID,
			UninstalledAt:       time.Now(),
			ScheduledDeletionAt: time.Now().AddDate(0, 0, retentionDays),
		}
		return tx.Create(retention).Error
	})
}

func (r *PluginRepository) FindInstallation(pluginID uuid.UUID, boardID *uuid.UUID, workspaceID *uuid.UUID) (*models.PluginInstallation, error) {
	var installation models.PluginInstallation
	query := r.db.Preload("Plugin")

	if boardID != nil {
		query = query.Where("plugin_id = ? AND board_id = ?", pluginID, *boardID)
	} else if workspaceID != nil {
		query = query.Where("plugin_id = ? AND workspace_id = ?", pluginID, *workspaceID)
	} else {
		return nil, errors.New("either boardID or workspaceID must be provided")
	}

	err := query.First(&installation).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &installation, err
}

func (r *PluginRepository) FindInstallationByID(installationID uuid.UUID) (*models.PluginInstallation, error) {
	var installation models.PluginInstallation
	err := r.db.Preload("Plugin").First(&installation, "id = ?", installationID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &installation, err
}

func (r *PluginRepository) FindInstallationsByBoard(boardID uuid.UUID) ([]models.PluginInstallation, error) {
	var installations []models.PluginInstallation

	// Get board to find workspace ID
	var board models.Board
	if err := r.db.Select("workspace_id").First(&board, "id = ?", boardID).Error; err != nil {
		return nil, err
	}

	err := r.db.
		Preload("Plugin").
		Preload("Plugin.Capabilities").
		Preload("Plugin.Permissions").
		Where("(board_id = ? OR workspace_id = ?) AND is_enabled = ?", boardID, board.WorkspaceID, true).
		Find(&installations).Error
	return installations, err
}

func (r *PluginRepository) FindInstallationsByWorkspace(workspaceID uuid.UUID) ([]models.PluginInstallation, error) {
	var installations []models.PluginInstallation
	err := r.db.
		Preload("Plugin").
		Preload("Plugin.Capabilities").
		Preload("Plugin.Permissions").
		Where("workspace_id = ? AND is_enabled = ?", workspaceID, true).
		Find(&installations).Error
	return installations, err
}

func (r *PluginRepository) UpdateInstallationSettings(installationID uuid.UUID, settings map[string]interface{}) error {
	return r.db.Model(&models.PluginInstallation{}).
		Where("id = ?", installationID).
		Update("settings", models.JSONMap(settings)).Error
}

func (r *PluginRepository) UpdateInstallation(installation *models.PluginInstallation) error {
	return r.db.Save(installation).Error
}

// API Key operations
func (r *PluginRepository) CreateAPIKey(apiKey *models.PluginAPIKey) error {
	return r.db.Create(apiKey).Error
}

func (r *PluginRepository) FindAPIKey(apiKey string) (*models.PluginAPIKey, error) {
	var key models.PluginAPIKey
	err := r.db.
		Preload("Plugin").
		Preload("Plugin.Permissions").
		Preload("Installation").
		First(&key, "api_key = ? AND is_active = ?", apiKey, true).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &key, err
}

func (r *PluginRepository) UpdateAPIKeyLastUsed(apiKeyID uuid.UUID) error {
	return r.db.Model(&models.PluginAPIKey{}).
		Where("id = ?", apiKeyID).
		Update("last_used_at", time.Now()).Error
}

func (r *PluginRepository) RevokeAPIKey(apiKeyID uuid.UUID) error {
	return r.db.Model(&models.PluginAPIKey{}).
		Where("id = ?", apiKeyID).
		Update("is_active", false).Error
}

// Data operations
func (r *PluginRepository) SetData(data *models.PluginData) error {
	// Upsert operation
	return r.db.
		Where("plugin_id = ? AND installation_id = ? AND scope = ? AND entity_id = ? AND key = ?",
			data.PluginID, data.InstallationID, data.Scope, data.EntityID, data.Key).
		Assign(map[string]interface{}{
			"value":        data.Value,
			"visibility":   data.Visibility,
			"is_encrypted": data.IsEncrypted,
			"updated_at":   time.Now(),
		}).
		FirstOrCreate(data).Error
}

func (r *PluginRepository) GetData(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID, key string) (*models.PluginData, error) {
	var data models.PluginData
	err := r.db.First(&data,
		"plugin_id = ? AND installation_id = ? AND scope = ? AND entity_id = ? AND key = ?",
		pluginID, installationID, scope, entityID, key).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &data, err
}

func (r *PluginRepository) GetDataByScope(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID) ([]models.PluginData, error) {
	var data []models.PluginData
	err := r.db.Find(&data,
		"plugin_id = ? AND installation_id = ? AND scope = ? AND entity_id = ?",
		pluginID, installationID, scope, entityID).Error
	return data, err
}

func (r *PluginRepository) DeleteData(pluginID, installationID uuid.UUID, scope string, entityID uuid.UUID, key string) error {
	return r.db.Delete(&models.PluginData{},
		"plugin_id = ? AND installation_id = ? AND scope = ? AND entity_id = ? AND key = ?",
		pluginID, installationID, scope, entityID, key).Error
}

// Secret operations
func (r *PluginRepository) SetSecret(secret *models.PluginSecret) error {
	return r.db.
		Where("plugin_id = ? AND installation_id = ? AND user_id = ? AND key = ?",
			secret.PluginID, secret.InstallationID, secret.UserID, secret.Key).
		Assign(map[string]interface{}{
			"encrypted_value":   secret.EncryptedValue,
			"encryption_key_id": secret.EncryptionKeyID,
			"updated_at":        time.Now(),
		}).
		FirstOrCreate(secret).Error
}

func (r *PluginRepository) GetSecret(pluginID, installationID uuid.UUID, userID *uuid.UUID, key string) (*models.PluginSecret, error) {
	var secret models.PluginSecret
	err := r.db.First(&secret,
		"plugin_id = ? AND installation_id = ? AND user_id = ? AND key = ?",
		pluginID, installationID, userID, key).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &secret, err
}

func (r *PluginRepository) DeleteSecret(pluginID, installationID uuid.UUID, userID *uuid.UUID, key string) error {
	return r.db.Delete(&models.PluginSecret{},
		"plugin_id = ? AND installation_id = ? AND user_id = ? AND key = ?",
		pluginID, installationID, userID, key).Error
}

// Cleanup operations
func (r *PluginRepository) FindExpiredData(limit int) ([]models.PluginDataRetention, error) {
	var retentions []models.PluginDataRetention
	err := r.db.
		Where("scheduled_deletion_at <= ? AND is_deleted = ?", time.Now(), false).
		Limit(limit).
		Find(&retentions).Error
	return retentions, err
}

func (r *PluginRepository) DeletePluginData(installationID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete all data
		if err := tx.Where("installation_id = ?", installationID).Delete(&models.PluginData{}).Error; err != nil {
			return err
		}

		// Delete all secrets
		if err := tx.Where("installation_id = ?", installationID).Delete(&models.PluginSecret{}).Error; err != nil {
			return err
		}

		// Delete API keys
		if err := tx.Where("installation_id = ?", installationID).Delete(&models.PluginAPIKey{}).Error; err != nil {
			return err
		}

		// Delete webhook deliveries
		var webhookIDs []uuid.UUID
		if err := tx.Model(&models.PluginWebhook{}).Where("installation_id = ?", installationID).Pluck("id", &webhookIDs).Error; err != nil {
			return err
		}
		if len(webhookIDs) > 0 {
			if err := tx.Where("webhook_id IN ?", webhookIDs).Delete(&models.WebhookDelivery{}).Error; err != nil {
				return err
			}
		}

		// Delete webhooks
		if err := tx.Where("installation_id = ?", installationID).Delete(&models.PluginWebhook{}).Error; err != nil {
			return err
		}

		// Delete installation
		if err := tx.Delete(&models.PluginInstallation{}, "id = ?", installationID).Error; err != nil {
			return err
		}

		// Mark retention as deleted
		if err := tx.Model(&models.PluginDataRetention{}).
			Where("installation_id = ?", installationID).
			Update("is_deleted", true).Error; err != nil {
			return err
		}

		return nil
	})
}

// Statistics
func (r *PluginRepository) IncrementInstallCount(pluginID uuid.UUID) error {
	return r.db.Model(&models.Plugin{}).
		Where("id = ?", pluginID).
		Update("install_count", gorm.Expr("install_count + ?", 1)).Error
}

func (r *PluginRepository) DecrementInstallCount(pluginID uuid.UUID) error {
	return r.db.Model(&models.Plugin{}).
		Where("id = ? AND install_count > 0", pluginID).
		Update("install_count", gorm.Expr("install_count - ?", 1)).Error
}

// HardDeletePlugin permanently deletes a plugin and all its related data
func (r *PluginRepository) HardDeletePlugin(pluginID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Get all installation IDs for this plugin
		var installationIDs []uuid.UUID
		if err := tx.Model(&models.PluginInstallation{}).
			Where("plugin_id = ?", pluginID).
			Pluck("id", &installationIDs).Error; err != nil {
			return err
		}

		// Delete data for all installations
		for _, instID := range installationIDs {
			// Delete plugin data
			if err := tx.Where("installation_id = ?", instID).Delete(&models.PluginData{}).Error; err != nil {
				return err
			}

			// Delete plugin secrets
			if err := tx.Where("installation_id = ?", instID).Delete(&models.PluginSecret{}).Error; err != nil {
				return err
			}

			// Delete API keys
			if err := tx.Where("installation_id = ?", instID).Delete(&models.PluginAPIKey{}).Error; err != nil {
				return err
			}

			// Delete webhook deliveries
			var webhookIDs []uuid.UUID
			if err := tx.Model(&models.PluginWebhook{}).Where("installation_id = ?", instID).Pluck("id", &webhookIDs).Error; err != nil {
				return err
			}
			if len(webhookIDs) > 0 {
				if err := tx.Where("webhook_id IN ?", webhookIDs).Delete(&models.WebhookDelivery{}).Error; err != nil {
					return err
				}
			}

			// Delete webhooks
			if err := tx.Where("installation_id = ?", instID).Delete(&models.PluginWebhook{}).Error; err != nil {
				return err
			}

			// Delete data retention records
			if err := tx.Where("installation_id = ?", instID).Delete(&models.PluginDataRetention{}).Error; err != nil {
				return err
			}
		}

		// Delete all installations
		if err := tx.Where("plugin_id = ?", pluginID).Delete(&models.PluginInstallation{}).Error; err != nil {
			return err
		}

		// Delete capabilities
		if err := tx.Where("plugin_id = ?", pluginID).Delete(&models.PluginCapability{}).Error; err != nil {
			return err
		}

		// Delete permissions
		if err := tx.Where("plugin_id = ?", pluginID).Delete(&models.PluginPermission{}).Error; err != nil {
			return err
		}

		// Delete the plugin itself
		if err := tx.Delete(&models.Plugin{}, "id = ?", pluginID).Error; err != nil {
			return err
		}

		return nil
	})
}
