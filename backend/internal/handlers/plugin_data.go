package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/constants"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

type PluginDataHandler struct {
	service *services.PluginService
}

func NewPluginDataHandler() *PluginDataHandler {
	repo := repository.NewPluginRepository(database.DB)
	service := services.NewPluginService(repo)
	return &PluginDataHandler{service: service}
}

// GET /api/plugin-data/:scope/:entityId - Get all data for an entity
func (h *PluginDataHandler) GetDataByScope(c *fiber.Ctx) error {
	// This endpoint is called by plugins using their API token
	pluginID := c.Locals("pluginID").(uuid.UUID)
	installationID := c.Locals("installationID").(uuid.UUID)

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}

	// Validate scope
	if !constants.ValidScopes[scope] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid scope"})
	}

	data, err := h.service.GetPluginDataByScope(pluginID, installationID, scope, entityID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch data"})
	}

	// Transform to key-value map
	result := make(map[string]interface{})
	for _, item := range data {
		result[item.Key] = item.Value
	}

	return c.JSON(result)
}

// GET /api/plugin-data/:scope/:entityId/:key - Get specific key
func (h *PluginDataHandler) GetData(c *fiber.Ctx) error {
	pluginID := c.Locals("pluginID").(uuid.UUID)
	installationID := c.Locals("installationID").(uuid.UUID)

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}
	key := c.Params("key")

	data, err := h.service.GetPluginData(pluginID, installationID, scope, entityID, key)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch data"})
	}
	if data == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Data not found"})
	}

	return c.JSON(data.Value)
}

// PUT /api/plugin-data/:scope/:entityId/:key - Set data
func (h *PluginDataHandler) SetData(c *fiber.Ctx) error {
	pluginID := c.Locals("pluginID").(uuid.UUID)
	installationID := c.Locals("installationID").(uuid.UUID)

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}
	key := c.Params("key")

	var value map[string]interface{}
	if err := c.BodyParser(&value); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.service.SetPluginData(pluginID, installationID, scope, entityID, key, value); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save data"})
	}

	return c.JSON(fiber.Map{"message": "Data saved successfully"})
}

// DELETE /api/plugin-data/:scope/:entityId/:key - Delete data
func (h *PluginDataHandler) DeleteData(c *fiber.Ctx) error {
	pluginID := c.Locals("pluginID").(uuid.UUID)
	installationID := c.Locals("installationID").(uuid.UUID)

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}
	key := c.Params("key")

	if err := h.service.DeletePluginData(pluginID, installationID, scope, entityID, key); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete data"})
	}

	return c.SendStatus(204)
}

// GET /api/plugin-proxy/:pluginId/:installationId/data/:scope/:entityId/:key - Get specific key (User Context)
func (h *PluginDataHandler) GetDataByUser(c *fiber.Ctx) error {
	pluginID, err := uuid.Parse(c.Params("pluginId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid plugin ID"})
	}
	installationID, err := uuid.Parse(c.Params("installationId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid installation ID"})
	}

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}
	key := c.Params("key")

	userID := middleware.GetUserID(c)

	// Verify user has access to entityID based on scope
	if !verifyUserAccess(userID, scope, entityID) {
		logger.Warn("User attempted to access plugin data without permission",
			zap.String("user_id", userID.String()),
			zap.String("scope", scope),
			zap.String("entity_id", entityID.String()),
		)
		return c.Status(403).JSON(fiber.Map{"error": "You don't have access to this data"})
	}

	data, err := h.service.GetPluginData(pluginID, installationID, scope, entityID, key)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch data"})
	}
	if data == nil {
		// Return null/empty instead of 404 to make frontend handling easier
		return c.JSON(nil)
	}

	return c.JSON(data.Value)
}

// PUT /api/plugin-proxy/:pluginId/:installationId/data/:scope/:entityId/:key - Set data (User Context)
func (h *PluginDataHandler) SetDataByUser(c *fiber.Ctx) error {
	pluginID, err := uuid.Parse(c.Params("pluginId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid plugin ID"})
	}
	installationID, err := uuid.Parse(c.Params("installationId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid installation ID"})
	}

	scope := c.Params("scope")
	entityID, err := uuid.Parse(c.Params("entityId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entity ID"})
	}
	key := c.Params("key")

	userID := middleware.GetUserID(c)

	// Verify user has write access to entityID
	if !verifyUserWriteAccess(userID, scope, entityID) {
		logger.Warn("User attempted to write plugin data without permission",
			zap.String("user_id", userID.String()),
			zap.String("scope", scope),
			zap.String("entity_id", entityID.String()),
		)
		return c.Status(403).JSON(fiber.Map{"error": "You don't have write access to this data"})
	}

	var value map[string]interface{}
	if err := c.BodyParser(&value); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.service.SetPluginData(pluginID, installationID, scope, entityID, key, value); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save data"})
	}

	return c.JSON(fiber.Map{"message": "Data saved successfully"})
}

// verifyUserAccess checks if user has read access to entity
func verifyUserAccess(userID uuid.UUID, scope string, entityID uuid.UUID) bool {
	db := database.DB

	switch scope {
	case constants.ScopeBoard:
		// Check if user is member of board's workspace
		var board models.Board
		if err := db.First(&board, "id = ?", entityID).Error; err != nil {
			return false
		}
		var membership models.WorkspaceMember
		return db.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error == nil

	case constants.ScopeCard:
		// Check if user has access to card's board
		var card models.Card
		if err := db.First(&card, "id = ?", entityID).Error; err != nil {
			return false
		}
		var list models.List
		if err := db.First(&list, "id = ?", card.ListID).Error; err != nil {
			return false
		}
		var board models.Board
		if err := db.First(&board, "id = ?", list.BoardID).Error; err != nil {
			return false
		}
		var membership models.WorkspaceMember
		return db.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error == nil

	case constants.ScopeList:
		// Check if user has access to list's board
		var list models.List
		if err := db.First(&list, "id = ?", entityID).Error; err != nil {
			return false
		}
		var board models.Board
		if err := db.First(&board, "id = ?", list.BoardID).Error; err != nil {
			return false
		}
		var membership models.WorkspaceMember
		return db.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error == nil

	case constants.ScopeWorkspace:
		// Check if user is workspace member
		var membership models.WorkspaceMember
		return db.First(&membership, "workspace_id = ? AND user_id = ?", entityID, userID).Error == nil

	case constants.ScopeUser:
		// User can only access their own data
		return entityID == userID

	default:
		return false
	}
}

// verifyUserWriteAccess checks if user has write access to entity
func verifyUserWriteAccess(userID uuid.UUID, scope string, entityID uuid.UUID) bool {
	db := database.DB

	// For most scopes, write access = read access
	// except we need to check user is not just a viewer
	switch scope {
	case constants.ScopeBoard:
		var board models.Board
		if err := db.First(&board, "id = ?", entityID).Error; err != nil {
			return false
		}
		var membership models.WorkspaceMember
		if err := db.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error; err != nil {
			return false
		}
		// Members can write (viewers cannot, but we don't have viewer role yet)
		return true

	case constants.ScopeCard, constants.ScopeList:
		// Same as read access for now
		return verifyUserAccess(userID, scope, entityID)

	case constants.ScopeWorkspace:
		// Check if user is workspace admin
		var membership models.WorkspaceMember
		if err := db.First(&membership, "workspace_id = ? AND user_id = ?", entityID, userID).Error; err != nil {
			return false
		}
		return membership.Role == "admin" || membership.Role == "owner"

	case constants.ScopeUser:
		// User can only write to their own data
		return entityID == userID

	default:
		return false
	}
}
