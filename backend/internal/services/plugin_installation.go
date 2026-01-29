package services

import (
	"errors"
	"fmt"

	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// Installation management

func (s *PluginService) InstallPlugin(pluginSlug string, req *models.InstallPluginRequest, installerID uuid.UUID) (*models.PluginInstallation, error) {
	// Get plugin
	plugin, err := s.repo.FindBySlug(pluginSlug)
	if err != nil {
		return nil, err
	}
	if plugin == nil {
		return nil, errors.New("plugin not found")
	}

	// Validate that plugin is published
	if plugin.Status != "published" {
		return nil, errors.New("plugin is not published")
	}

	// Parse scope
	var workspaceID, boardID *uuid.UUID
	if req.WorkspaceID != nil {
		id, err := uuid.Parse(*req.WorkspaceID)
		if err != nil {
			return nil, errors.New("invalid workspace_id")
		}
		workspaceID = &id
	}
	if req.BoardID != nil {
		id, err := uuid.Parse(*req.BoardID)
		if err != nil {
			return nil, errors.New("invalid board_id")
		}
		boardID = &id
	}

	// Validate that at least one scope is provided
	if workspaceID == nil && boardID == nil {
		return nil, errors.New("either workspace_id or board_id must be provided")
	}

	// Check if already installed
	existing, err := s.repo.FindInstallation(plugin.ID, boardID, workspaceID)
	if err != nil {
		return nil, err
	}

	// Fetch manifest and get default settings
	defaults := make(map[string]interface{})
	if manifest, err := s.fetchManifest(plugin.ManifestURL); err == nil {
		defaults = s.parseDefaultSettings(manifest)
	} else {
		logger.Warn("Failed to fetch manifest for default settings",
			zap.String("plugin_id", plugin.ID.String()),
			zap.String("manifest_url", plugin.ManifestURL),
			zap.Error(err),
		)
	}

	// Prepare final settings
	finalSettings := make(models.JSONMap)
	// Apply defaults first
	for k, v := range defaults {
		finalSettings[k] = v
	}
	// Apply request settings (precedence)
	if req.Settings != nil {
		for k, v := range req.Settings {
			finalSettings[k] = v
		}
	}

	if existing != nil {
		if existing.IsEnabled {
			return nil, errors.New("plugin already installed at this scope")
		}

		// Reactivate installation
		existing.IsEnabled = true
		existing.InstalledBy = &installerID

		// Merge with existing settings if any, otherwise just use calculated defaults + req
		if existing.Settings == nil {
			existing.Settings = finalSettings
		} else {
			// If existing settings, we only apply req settings over them, and maybe defaults if missing?
			// Strategy: valid existing settings > req settings > defaults?
			// User wants "initialize defaults", usually implies "if not present".
			// Since we have 'finalSettings' which is (defaults + req), let's merge that into existing.

			// Actually simpler: merge finalSettings into existing.Settings
			for k, v := range finalSettings {
				existing.Settings[k] = v
			}
		}

		if err := s.repo.UpdateInstallation(existing); err != nil {
			return nil, err
		}

		return existing, nil
	}

	// Create installation
	installation := &models.PluginInstallation{
		PluginID:    plugin.ID,
		WorkspaceID: workspaceID,
		BoardID:     boardID,
		InstalledBy: &installerID,
		IsEnabled:   true,
		Settings:    finalSettings,
	}

	if err := s.repo.Install(installation); err != nil {
		logger.Error("Failed to install plugin",
			zap.String("plugin_id", plugin.ID.String()),
			zap.String("plugin_slug", plugin.Slug),
			zap.String("installer_id", installerID.String()),
			zap.Error(err),
		)
		return nil, err
	}

	// Increment install count
	if err := s.repo.IncrementInstallCount(plugin.ID); err != nil {
		logger.Warn("Failed to increment install count",
			zap.String("plugin_id", plugin.ID.String()),
			zap.Error(err),
		)
	}

	// Generate API key for this installation
	if err := s.generateAPIKey(plugin.ID, installation.ID); err != nil {
		logger.Error("Failed to generate API key for installation",
			zap.String("plugin_id", plugin.ID.String()),
			zap.String("installation_id", installation.ID.String()),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	logger.Info("Plugin installed",
		zap.String("plugin_id", plugin.ID.String()),
		zap.String("plugin_slug", plugin.Slug),
		zap.String("installation_id", installation.ID.String()),
		zap.String("installer_id", installerID.String()),
		zap.Any("board_id", installation.BoardID),
		zap.Any("workspace_id", installation.WorkspaceID),
	)

	return installation, nil
}

func (s *PluginService) UninstallPlugin(pluginSlug string, boardID *string, workspaceID *string, retentionDays int) error {
	// Get plugin
	plugin, err := s.repo.FindBySlug(pluginSlug)
	if err != nil {
		return err
	}
	if plugin == nil {
		return errors.New("plugin not found")
	}

	// Parse scope
	var bID, wID *uuid.UUID
	if boardID != nil {
		id, err := uuid.Parse(*boardID)
		if err != nil {
			return errors.New("invalid board_id")
		}
		bID = &id
	}
	if workspaceID != nil {
		id, err := uuid.Parse(*workspaceID)
		if err != nil {
			return errors.New("invalid workspace_id")
		}
		wID = &id
	}

	// Find installation
	installation, err := s.repo.FindInstallation(plugin.ID, bID, wID)
	if err != nil {
		return err
	}
	if installation == nil {
		return errors.New("plugin not installed at this scope")
	}

	// Uninstall with retention
	if err := s.repo.Uninstall(installation.ID, retentionDays); err != nil {
		logger.Error("Failed to uninstall plugin",
			zap.String("plugin_id", plugin.ID.String()),
			zap.String("installation_id", installation.ID.String()),
			zap.Error(err),
		)
		return err
	}

	// Decrement install count
	if err := s.repo.DecrementInstallCount(plugin.ID); err != nil {
		logger.Warn("Failed to decrement install count",
			zap.String("plugin_id", plugin.ID.String()),
			zap.Error(err),
		)
	}

	logger.Info("Plugin uninstalled",
		zap.String("plugin_id", plugin.ID.String()),
		zap.String("plugin_slug", plugin.Slug),
		zap.String("installation_id", installation.ID.String()),
		zap.Int("retention_days", retentionDays),
	)

	return nil
}

func (s *PluginService) GetBoardPlugins(boardID uuid.UUID) ([]models.PluginInstallation, error) {
	return s.repo.FindInstallationsByBoard(boardID)
}

func (s *PluginService) GetWorkspacePlugins(workspaceID uuid.UUID) ([]models.PluginInstallation, error) {
	return s.repo.FindInstallationsByWorkspace(workspaceID)
}

func (s *PluginService) UpdatePluginSettings(pluginSlug string, boardID *string, workspaceID *string, req *models.UpdatePluginSettingsRequest) error {
	// Get plugin
	plugin, err := s.repo.FindBySlug(pluginSlug)
	if err != nil {
		return err
	}
	if plugin == nil {
		return errors.New("plugin not found")
	}

	// Parse scope
	var bID, wID *uuid.UUID
	if boardID != nil {
		id, err := uuid.Parse(*boardID)
		if err != nil {
			return errors.New("invalid board_id")
		}
		bID = &id
	}
	if workspaceID != nil {
		id, err := uuid.Parse(*workspaceID)
		if err != nil {
			return errors.New("invalid workspace_id")
		}
		wID = &id
	}

	// Find installation
	installation, err := s.repo.FindInstallation(plugin.ID, bID, wID)
	if err != nil {
		return err
	}
	if installation == nil {
		return errors.New("plugin not installed")
	}

	err = s.repo.UpdateInstallationSettings(installation.ID, req.Settings)
	if err != nil {
		logger.Error("Failed to update plugin settings",
			zap.String("plugin_id", plugin.ID.String()),
			zap.String("installation_id", installation.ID.String()),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Plugin settings updated",
		zap.String("plugin_id", plugin.ID.String()),
		zap.String("installation_id", installation.ID.String()),
	)

	return nil
}

// API Key generation
func (s *PluginService) generateAPIKey(pluginID, installationID uuid.UUID) error {
	// Generate random API key
	apiKey, err := generateRandomString(32)
	if err != nil {
		return err
	}

	// Generate random secret
	secret, err := generateRandomString(64)
	if err != nil {
		return err
	}

	// Hash secret
	secretHash, err := bcrypt.GenerateFromPassword([]byte(secret), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	key := &models.PluginAPIKey{
		PluginID:       pluginID,
		InstallationID: installationID,
		APIKey:         apiKey,
		APISecretHash:  string(secretHash),
		IsActive:       true,
	}

	return s.repo.CreateAPIKey(key)
}

// GetInstallation retrieves an installation by ID
func (s *PluginService) GetInstallation(id uuid.UUID) (*models.PluginInstallation, error) {
	return s.repo.FindInstallationByID(id)
}

// UpdateInstallationSettings updates settings for a specific installation
func (s *PluginService) UpdateInstallationSettings(installationID uuid.UUID, settings map[string]interface{}) error {
	return s.repo.UpdateInstallationSettings(installationID, settings)
}

// Helper methods for manifest handling

type Manifest struct {
	Settings map[string]ManifestSetting `json:"settings"`
}

type ManifestSetting struct {
	Default interface{} `json:"default"`
}

func (s *PluginService) fetchManifest(url string) (*Manifest, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch manifest: status %d", resp.StatusCode)
	}

	var manifest Manifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, err
	}

	return &manifest, nil
}

func (s *PluginService) parseDefaultSettings(manifest *Manifest) map[string]interface{} {
	defaults := make(map[string]interface{})
	if manifest.Settings == nil {
		return defaults
	}

	for key, setting := range manifest.Settings {
		if setting.Default != nil {
			defaults[key] = setting.Default
		}
	}

	return defaults
}
