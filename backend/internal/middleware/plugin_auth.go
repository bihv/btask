package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/constants"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// PluginAuthMiddleware validates plugin API tokens
func PluginAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get plugin token from header
		token := c.Get("X-Plugin-Token")
		if token == "" {
			// Try Authorization header
			auth := c.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				token = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if token == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Plugin token required",
			})
		}

		// Validate token
		repo := repository.NewPluginRepository(database.DB)
		apiKey, err := repo.FindAPIKey(token)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to validate token",
			})
		}

		if apiKey == nil || !apiKey.IsActive {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid or inactive token",
			})
		}

		// Check if token is expired
		if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
			logger.Warn("Plugin token expired",
				zap.String("plugin_id", apiKey.PluginID.String()),
				zap.String("installation_id", apiKey.InstallationID.String()),
			)
			return c.Status(401).JSON(fiber.Map{
				"error": "Token expired",
			})
		}

		// Set plugin context
		c.Locals("pluginID", apiKey.PluginID)
		c.Locals("installationID", apiKey.InstallationID)
		c.Locals("plugin", apiKey.Plugin)
		c.Locals("installation", apiKey.Installation)
		c.Locals("isPluginRequest", true)

		// Update last used time (async, don't block request)
		// Wrap in anonymous function to properly handle errors
		go func() {
			if err := repo.UpdateAPIKeyLastUsed(apiKey.ID); err != nil {
				logger.Warn("Failed to update API key last used time",
					zap.String("api_key_id", apiKey.ID.String()),
					zap.Error(err),
				)
			}
		}()

		return c.Next()
	}
}

// PluginPermissionMiddleware checks if plugin has required permission
func PluginPermissionMiddleware(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		pluginID := c.Locals("pluginID")
		if pluginID == nil {
			return c.Status(403).JSON(fiber.Map{
				"error": "Plugin context not found",
			})
		}

		// Get plugin with permissions
		repo := repository.NewPluginRepository(database.DB)
		plugin, err := repo.FindByID(pluginID.(uuid.UUID))
		if err != nil || plugin == nil {
			logger.Error("Failed to load plugin for permission check",
				zap.String("plugin_id", pluginID.(uuid.UUID).String()),
				zap.Error(err),
			)
			return c.Status(403).JSON(fiber.Map{
				"error": "Failed to verify permissions",
			})
		}

		// Check if plugin has the required permission
		hasPermission := false
		for _, perm := range plugin.Permissions {
			if perm.Permission == requiredPermission || perm.Permission == "*" {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			logger.Warn("Plugin missing required permission",
				zap.String("plugin_id", plugin.ID.String()),
				zap.String("plugin_slug", plugin.Slug),
				zap.String("required_permission", requiredPermission),
			)
			return c.Status(403).JSON(fiber.Map{
				"error": "Plugin does not have required permission: " + requiredPermission,
			})
		}

		return c.Next()
	}
}

// PluginScopeMiddleware validates that the requested entity is within plugin's scope
func PluginScopeMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		installationID := c.Locals("installationID")
		if installationID == nil {
			return c.Status(403).JSON(fiber.Map{
				"error": "Installation context not found",
			})
		}

		// Get the entity being accessed from path params
		scope := c.Params("scope")
		entityIDStr := c.Params("entityId")

		// Skip validation if no scope/entity in path
		if scope == "" || entityIDStr == "" {
			return c.Next()
		}

		entityID, err := uuid.Parse(entityIDStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid entity ID",
			})
		}

		// Get installation to check scope
		var installation models.PluginInstallation
		if err := database.DB.Preload("Plugin").First(&installation, "id = ?", installationID).Error; err != nil {
			logger.Error("Failed to load installation for scope check",
				zap.String("installation_id", installationID.(uuid.UUID).String()),
				zap.Error(err),
			)
			return c.Status(403).JSON(fiber.Map{
				"error": "Failed to verify scope",
			})
		}

		// Validate scope based on installation type and entity
		valid := validatePluginScope(scope, entityID, &installation)
		if !valid {
			logger.Warn("Plugin attempted to access entity outside scope",
				zap.String("plugin_id", installation.PluginID.String()),
				zap.String("installation_id", installation.ID.String()),
				zap.String("scope", scope),
				zap.String("entity_id", entityID.String()),
			)
			return c.Status(403).JSON(fiber.Map{
				"error": "Entity is outside plugin scope",
			})
		}

		return c.Next()
	}
}

// validatePluginScope checks if entity is within plugin's installation scope
func validatePluginScope(scope string, entityID uuid.UUID, installation *models.PluginInstallation) bool {
	db := database.DB

	switch scope {
	case constants.ScopeBoard:
		// If plugin installed on board, entity must be that board
		if installation.BoardID != nil {
			return *installation.BoardID == entityID
		}
		// If plugin installed on workspace, check if board belongs to workspace
		if installation.WorkspaceID != nil {
			var board struct {
				WorkspaceID uuid.UUID
			}
			if err := db.Table("boards").Select("workspace_id").Where("id = ?", entityID).First(&board).Error; err != nil {
				return false
			}
			return board.WorkspaceID == *installation.WorkspaceID
		}
		return false

	case constants.ScopeCard:
		// Check if card belongs to installation's board or workspace
		var card struct {
			ListID uuid.UUID
		}
		if err := db.Table("cards").Select("list_id").Where("id = ?", entityID).First(&card).Error; err != nil {
			return false
		}

		var list struct {
			BoardID uuid.UUID
		}
		if err := db.Table("lists").Select("board_id").Where("id = ?", card.ListID).First(&list).Error; err != nil {
			return false
		}

		// If plugin installed on specific board
		if installation.BoardID != nil {
			return *installation.BoardID == list.BoardID
		}

		// If plugin installed on workspace, check if board belongs to workspace
		if installation.WorkspaceID != nil {
			var board struct {
				WorkspaceID uuid.UUID
			}
			if err := db.Table("boards").Select("workspace_id").Where("id = ?", list.BoardID).First(&board).Error; err != nil {
				return false
			}
			return board.WorkspaceID == *installation.WorkspaceID
		}
		return false

	case constants.ScopeList:
		// Check if list belongs to installation's board or workspace
		var list struct {
			BoardID uuid.UUID
		}
		if err := db.Table("lists").Select("board_id").Where("id = ?", entityID).First(&list).Error; err != nil {
			return false
		}

		if installation.BoardID != nil {
			return *installation.BoardID == list.BoardID
		}

		if installation.WorkspaceID != nil {
			var board struct {
				WorkspaceID uuid.UUID
			}
			if err := db.Table("boards").Select("workspace_id").Where("id = ?", list.BoardID).First(&board).Error; err != nil {
				return false
			}
			return board.WorkspaceID == *installation.WorkspaceID
		}
		return false

	case constants.ScopeWorkspace:
		// Entity must be the workspace where plugin is installed
		if installation.WorkspaceID != nil {
			return *installation.WorkspaceID == entityID
		}
		// If installed on board, check if board belongs to workspace
		if installation.BoardID != nil {
			var board struct {
				WorkspaceID uuid.UUID
			}
			if err := db.Table("boards").Select("workspace_id").Where("id = ?", *installation.BoardID).First(&board).Error; err != nil {
				return false
			}
			return board.WorkspaceID == entityID
		}
		return false

	case constants.ScopeUser:
		// User scope is always allowed (user-specific data)
		return true

	default:
		return false
	}
}

// Rate limiting state (in-memory for now, should use Redis in production)
var (
	pluginRequestCounts = make(map[string][]time.Time)
	pluginDataSizes     = make(map[string]int64)
)

// RateLimitPlugin applies rate limiting for plugin requests
func RateLimitPlugin(requestsPerMinute int) fiber.Handler {
	if requestsPerMinute <= 0 {
		requestsPerMinute = constants.MaxRequestsPerMinute
	}

	return func(c *fiber.Ctx) error {
		pluginID := c.Locals("pluginID")
		if pluginID == nil {
			return c.Next()
		}

		key := pluginID.(uuid.UUID).String()
		now := time.Now()
		cutoff := now.Add(-1 * time.Minute)

		// Clean old entries
		if times, ok := pluginRequestCounts[key]; ok {
			newTimes := []time.Time{}
			for _, t := range times {
				if t.After(cutoff) {
					newTimes = append(newTimes, t)
				}
			}
			pluginRequestCounts[key] = newTimes
		}

		// Check rate limit
		if len(pluginRequestCounts[key]) >= requestsPerMinute {
			logger.Warn("Plugin rate limit exceeded",
				zap.String("plugin_id", key),
				zap.Int("requests", len(pluginRequestCounts[key])),
			)
			return c.Status(429).JSON(fiber.Map{
				"error": "Rate limit exceeded. Try again later.",
			})
		}

		// Record this request
		pluginRequestCounts[key] = append(pluginRequestCounts[key], now)

		return c.Next()
	}
}

// CheckPluginDataSize validates plugin data size limits
func CheckPluginDataSize(pluginID uuid.UUID, additionalSize int64) error {
	key := pluginID.String()
	currentSize := pluginDataSizes[key]

	if currentSize+additionalSize > constants.MaxDataSizePerPlugin {
		return fiber.NewError(413, "Plugin data size limit exceeded")
	}

	pluginDataSizes[key] = currentSize + additionalSize
	return nil
}

// Helper functions
func getEntityTypeFromPath(path string) string {
	// Extract entity type from path
	// e.g., /api/boards/:id -> "board"
	// e.g., /api/cards/:id -> "card"

	if strings.Contains(path, "/boards/") {
		return "board"
	}
	if strings.Contains(path, "/cards/") {
		return "card"
	}
	if strings.Contains(path, "/lists/") {
		return "list"
	}
	if strings.Contains(path, "/workspaces/") {
		return "workspace"
	}

	return ""
}

func getEntityIDFromParams(c *fiber.Ctx) uuid.UUID {
	// Try common param names
	idStr := c.Params("id")
	if idStr == "" {
		idStr = c.Params("boardId")
	}
	if idStr == "" {
		idStr = c.Params("cardId")
	}
	if idStr == "" {
		idStr = c.Params("listId")
	}
	if idStr == "" {
		idStr = c.Params("workspaceId")
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil
	}

	return id
}

// ValidatePluginAPIKey validates API key and secret for initial authentication
func ValidatePluginAPIKey(apiKey, apiSecret string) (bool, error) {
	repo := repository.NewPluginRepository(database.DB)
	key, err := repo.FindAPIKey(apiKey)
	if err != nil {
		return false, err
	}

	if key == nil || !key.IsActive {
		return false, nil
	}

	// Verify secret
	err = bcrypt.CompareHashAndPassword([]byte(key.APISecretHash), []byte(apiSecret))
	if err != nil {
		return false, nil
	}

	return true, nil
}
