package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

// Plugin CRUD operations

func (s *PluginService) CreatePlugin(req *models.CreatePluginRequest, authorID uuid.UUID) (*models.Plugin, error) {
	// Check if slug already exists
	existing, err := s.repo.FindBySlug(req.Slug)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("plugin with this slug already exists")
	}

	plugin := &models.Plugin{
		Slug:             req.Slug,
		Name:             req.Name,
		Description:      req.Description,
		Version:          req.Version,
		AuthorID:         &authorID,
		IconURL:          req.IconURL,
		HomepageURL:      req.HomepageURL,
		PrivacyPolicyURL: req.PrivacyPolicyURL,
		ManifestURL:      req.ManifestURL,
		ClientURL:        req.ClientURL,
		ServerURL:        req.ServerURL,
		Status:           "draft",
		PricingType:      req.PricingType,
		PriceMonthly:     req.PriceMonthly,
		PriceYearly:      req.PriceYearly,
	}

	if plugin.PricingType == "" {
		plugin.PricingType = "free"
	}

	err = s.repo.Create(plugin, req.Capabilities, req.Permissions)
	if err != nil {
		logger.Error("Failed to create plugin",
			zap.String("slug", req.Slug),
			zap.String("author_id", authorID.String()),
			zap.Error(err),
		)
		return nil, err
	}

	logger.Info("Plugin created",
		zap.String("plugin_id", plugin.ID.String()),
		zap.String("slug", plugin.Slug),
		zap.String("name", plugin.Name),
		zap.String("author_id", authorID.String()),
	)

	return s.repo.FindByID(plugin.ID)
}

func (s *PluginService) GetPlugin(id uuid.UUID) (*models.Plugin, error) {
	return s.repo.FindByID(id)
}

func (s *PluginService) GetPluginBySlug(slug string) (*models.Plugin, error) {
	return s.repo.FindBySlug(slug)
}

func (s *PluginService) ListPlugins(status string, isPublic *bool) ([]models.Plugin, error) {
	return s.repo.FindAll(status, isPublic)
}

func (s *PluginService) GetMyPlugins(userID uuid.UUID) ([]models.Plugin, error) {
	return s.repo.FindByAuthorID(userID)
}

func (s *PluginService) AdminListPlugins(status string, search string, page, limit int) ([]models.Plugin, int64, error) {
	return s.repo.FindAllWithFilters(status, search, page, limit)
}

func (s *PluginService) UpdatePlugin(id uuid.UUID, req *models.UpdatePluginRequest) (*models.Plugin, error) {
	plugin, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if plugin == nil {
		return nil, errors.New("plugin not found")
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Version != "" {
		updates["version"] = req.Version
	}
	if req.IconURL != "" {
		updates["icon_url"] = req.IconURL
	}
	if req.HomepageURL != "" {
		updates["homepage_url"] = req.HomepageURL
	}
	if req.PrivacyPolicyURL != "" {
		updates["privacy_policy_url"] = req.PrivacyPolicyURL
	}
	if req.ManifestURL != "" {
		updates["manifest_url"] = req.ManifestURL
	}
	if req.ClientURL != "" {
		updates["client_url"] = req.ClientURL
	}
	if req.ServerURL != "" {
		updates["server_url"] = req.ServerURL
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}
	if req.PricingType != "" {
		updates["pricing_type"] = req.PricingType
	}
	if req.PriceMonthly != nil {
		updates["price_monthly"] = *req.PriceMonthly
	}
	if req.PriceYearly != nil {
		updates["price_yearly"] = *req.PriceYearly
	}

	if len(updates) > 0 {
		if err := s.repo.Update(id, updates); err != nil {
			return nil, err
		}
	}

	// Update capabilities if provided
	if len(req.Capabilities) > 0 {
		if err := s.repo.UpdateCapabilities(id, req.Capabilities); err != nil {
			return nil, err
		}
	}

	// Update permissions if provided
	if len(req.Permissions) > 0 {
		if err := s.repo.UpdatePermissions(id, req.Permissions); err != nil {
			return nil, err
		}
	}

	logger.Info("Plugin updated",
		zap.String("plugin_id", id.String()),
		zap.Any("updates", updates),
	)

	return s.repo.FindByID(id)
}

func (s *PluginService) DeletePlugin(id uuid.UUID) error {
	plugin, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if plugin == nil {
		return errors.New("plugin not found")
	}

	logger.Info("Plugin deleted",
		zap.String("plugin_id", id.String()),
		zap.String("slug", plugin.Slug),
	)

	return s.repo.Delete(id)
}

// HardDeletePlugin permanently deletes a plugin, its files, and all related data
func (s *PluginService) HardDeletePlugin(id uuid.UUID) error {
	plugin, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if plugin == nil {
		return errors.New("plugin not found")
	}

	logger.Info("Hard deleting plugin",
		zap.String("plugin_id", id.String()),
		zap.String("slug", plugin.Slug),
	)

	// Delete plugin files from storage
	minioStorage := storage.GetMinioStorage()
	if minioStorage != nil {
		ctx := context.Background()
		if err := minioStorage.DeletePluginFiles(ctx, id.String()); err != nil {
			logger.Warn("Failed to delete plugin files from storage",
				zap.String("plugin_id", id.String()),
				zap.Error(err),
			)
			// Continue with database deletion even if file deletion fails
		}
	}

	// Hard delete from database (cascading delete of all related data)
	if err := s.repo.HardDeletePlugin(id); err != nil {
		logger.Error("Failed to hard delete plugin from database",
			zap.String("plugin_id", id.String()),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Plugin hard deleted successfully",
		zap.String("plugin_id", id.String()),
		zap.String("slug", plugin.Slug),
	)

	return nil
}
