package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
)

type PluginHandler struct {
	service *services.PluginService
}

func NewPluginHandler() *PluginHandler {
	repo := repository.NewPluginRepository(database.DB)
	service := services.NewPluginService(repo)
	return &PluginHandler{service: service}
}

// GET /api/plugins - List all published plugins
func (h *PluginHandler) GetAll(c *fiber.Ctx) error {
	// Only show published plugins to regular users
	plugins, err := h.service.ListPlugins("published", nil)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugins"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    plugins,
	})
}

// GET /api/plugins/my - List current user's plugins
func (h *PluginHandler) GetMyPlugins(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	plugins, err := h.service.GetMyPlugins(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugins"})
	}

	return c.JSON(plugins)
}

// GET /api/admin/plugins - List all plugins for admin
func (h *PluginHandler) AdminGetAll(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	search := c.Query("search", "")
	status := c.Query("status", "all")

	plugins, total, err := h.service.AdminListPlugins(status, search, page, limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugins"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"plugins": plugins,
			"total":   total,
			"page":    page,
			"limit":   limit,
		},
	})
}

// GET /api/plugins/:slug - Get plugin by slug
func (h *PluginHandler) GetBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")

	plugin, err := h.service.GetPluginBySlug(slug)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugin"})
	}
	if plugin == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Plugin not found"})
	}

	// Check if user can view this plugin
	if !plugin.IsPublic {
		userID := middleware.GetUserID(c)
		isAdmin := middleware.IsAdmin(c)

		// Only author or admin can view private plugins
		if !isAdmin && (plugin.AuthorID == nil || *plugin.AuthorID != userID) {
			return c.Status(404).JSON(fiber.Map{"error": "Plugin not found"})
		}
	}

	return c.JSON(plugin)
}

// POST /api/plugins - Create new plugin (developers only)
func (h *PluginHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req models.CreatePluginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	plugin, err := h.service.CreatePlugin(&req, userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(plugin)
}

// PUT /api/plugins/:id - Update plugin
func (h *PluginHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid plugin ID"})
	}

	userID := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	// Check ownership
	plugin, err := h.service.GetPlugin(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugin"})
	}
	if plugin == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Plugin not found"})
	}

	// Only author or admin can update
	if !isAdmin && (plugin.AuthorID == nil || *plugin.AuthorID != userID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to update this plugin"})
	}

	var req models.UpdatePluginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	updated, err := h.service.UpdatePlugin(id, &req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(updated)
}

// DELETE /api/plugins/:id - Delete plugin
func (h *PluginHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid plugin ID"})
	}

	userID := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	// Check ownership
	plugin, err := h.service.GetPlugin(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugin"})
	}
	if plugin == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Plugin not found"})
	}

	// Only author or admin can delete
	if !isAdmin && (plugin.AuthorID == nil || *plugin.AuthorID != userID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to delete this plugin"})
	}

	if err := h.service.DeletePlugin(id); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete plugin"})
	}

	return c.SendStatus(204)
}

// DELETE /api/admin/plugins/:id - Hard delete plugin (admin only)
func (h *PluginHandler) AdminHardDelete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid plugin ID"})
	}

	if err := h.service.HardDeletePlugin(id); err != nil {
		if err.Error() == "plugin not found" {
			return c.Status(404).JSON(fiber.Map{"error": "Plugin not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete plugin"})
	}

	return c.SendStatus(204)
}

// POST /api/boards/:id/plugins/:slug/install - Install plugin to board
func (h *PluginHandler) InstallToBoard(c *fiber.Ctx) error {
	boardID := c.Params("id")
	slug := c.Params("slug")
	userID := middleware.GetUserID(c)

	// Check if user has permission to install plugins on this board
	boardUUID, err := uuid.Parse(boardID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid board ID"})
	}

	// Check if user is board admin or workspace admin
	if !h.canManageBoard(userID, boardUUID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to install plugins on this board"})
	}

	var req models.InstallPluginRequest
	if err := c.BodyParser(&req); err != nil {
		// Allow empty body
		req = models.InstallPluginRequest{}
	}

	req.BoardID = &boardID

	installation, err := h.service.InstallPlugin(slug, &req, userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(installation)
}

// DELETE /api/boards/:id/plugins/:slug/uninstall - Uninstall plugin from board
func (h *PluginHandler) UninstallFromBoard(c *fiber.Ctx) error {
	boardID := c.Params("id")
	slug := c.Params("slug")
	userID := middleware.GetUserID(c)

	// Check if user has permission to uninstall plugins on this board
	boardUUID, err := uuid.Parse(boardID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid board ID"})
	}

	if !h.canManageBoard(userID, boardUUID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to uninstall plugins on this board"})
	}

	// Default retention: 90 days
	retentionDays := 90

	if err := h.service.UninstallPlugin(slug, &boardID, nil, retentionDays); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}

// PUT /api/boards/:id/plugins/:slug/settings - Update plugin settings
func (h *PluginHandler) UpdateBoardPluginSettings(c *fiber.Ctx) error {
	boardID := c.Params("id")
	slug := c.Params("slug")
	userID := middleware.GetUserID(c)

	// Check if user has permission to update plugin settings on this board
	boardUUID, err := uuid.Parse(boardID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid board ID"})
	}

	if !h.canManageBoard(userID, boardUUID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to update plugin settings on this board"})
	}

	var req models.UpdatePluginSettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.service.UpdatePluginSettings(slug, &boardID, nil, &req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Settings updated successfully"})
}

// GET /api/boards/:id/plugins - List plugins installed on board
func (h *PluginHandler) GetBoardPlugins(c *fiber.Ctx) error {
	boardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid board ID"})
	}

	userID := middleware.GetUserID(c)

	// Check if user has access to this board
	if !h.canAccessBoard(userID, boardID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have access to this board"})
	}

	installations, err := h.service.GetBoardPlugins(boardID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugins"})
	}

	return c.JSON(installations)
}

// Workspace plugin routes (similar to board routes)
func (h *PluginHandler) InstallToWorkspace(c *fiber.Ctx) error {
	workspaceID := c.Params("id")
	slug := c.Params("slug")
	userID := middleware.GetUserID(c)

	// Check if user is workspace admin
	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid workspace ID"})
	}

	if !h.canManageWorkspace(userID, workspaceUUID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to install plugins on this workspace"})
	}

	var req models.InstallPluginRequest
	if err := c.BodyParser(&req); err != nil {
		req = models.InstallPluginRequest{}
	}

	req.WorkspaceID = &workspaceID

	installation, err := h.service.InstallPlugin(slug, &req, userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(installation)
}

func (h *PluginHandler) UninstallFromWorkspace(c *fiber.Ctx) error {
	workspaceID := c.Params("id")
	slug := c.Params("slug")
	userID := middleware.GetUserID(c)

	// Check if user is workspace admin
	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid workspace ID"})
	}

	if !h.canManageWorkspace(userID, workspaceUUID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to uninstall plugins on this workspace"})
	}

	retentionDays := 90

	if err := h.service.UninstallPlugin(slug, nil, &workspaceID, retentionDays); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}

func (h *PluginHandler) GetWorkspacePlugins(c *fiber.Ctx) error {
	workspaceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid workspace ID"})
	}

	userID := middleware.GetUserID(c)

	// Check if user has access to workspace
	if !h.canAccessWorkspace(userID, workspaceID) {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have access to this workspace"})
	}

	installations, err := h.service.GetWorkspacePlugins(workspaceID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plugins"})
	}

	return c.JSON(installations)
}

// Helper functions for permission checks

func (h *PluginHandler) canAccessBoard(userID, boardID uuid.UUID) bool {
	// Check if board exists and user has access
	var board models.Board
	if err := database.DB.First(&board, "id = ?", boardID).Error; err != nil {
		return false
	}

	// Check if user is workspace member
	var membership models.WorkspaceMember
	err := database.DB.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error
	return err == nil
}

func (h *PluginHandler) canManageBoard(userID, boardID uuid.UUID) bool {
	isAdmin := false

	// Check if user is system admin
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err == nil {
		isAdmin = user.IsAdmin
	}

	if isAdmin {
		return true
	}

	// Get board and workspace
	var board models.Board
	if err := database.DB.First(&board, "id = ?", boardID).Error; err != nil {
		return false
	}

	// Check if user is workspace admin
	var membership models.WorkspaceMember
	err := database.DB.First(&membership, "workspace_id = ? AND user_id = ?", board.WorkspaceID, userID).Error
	if err != nil {
		return false
	}

	return membership.Role == "admin" || membership.Role == "owner"
}

func (h *PluginHandler) canAccessWorkspace(userID, workspaceID uuid.UUID) bool {
	var membership models.WorkspaceMember
	err := database.DB.First(&membership, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
	return err == nil
}

func (h *PluginHandler) canManageWorkspace(userID, workspaceID uuid.UUID) bool {
	isAdmin := false

	// Check if user is system admin
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err == nil {
		isAdmin = user.IsAdmin
	}

	if isAdmin {
		return true
	}

	// Check if user is workspace admin/owner
	var membership models.WorkspaceMember
	err := database.DB.First(&membership, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
	if err != nil {
		return false
	}

	return membership.Role == "admin" || membership.Role == "owner"
}

// GET /api/plugin-installations/:id/settings - Get installation settings
func (h *PluginHandler) GetInstallationSettings(c *fiber.Ctx) error {
	installationID := c.Params("id")
	userID := middleware.GetUserID(c)

	installationUUID, err := uuid.Parse(installationID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid installation ID"})
	}

	installation, err := h.service.GetInstallation(installationUUID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch installation"})
	}
	if installation == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Installation not found"})
	}

	// Check permission (must be admin or workspace admin/owner)
	hasAccess := false
	if installation.WorkspaceID != nil {
		hasAccess = h.canManageWorkspace(userID, *installation.WorkspaceID)
	} else if installation.BoardID != nil {
		hasAccess = h.canManageBoard(userID, *installation.BoardID)
	}

	if !hasAccess {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to view settings for this installation"})
	}

	return c.JSON(installation.Settings)
}

// PUT /api/plugin-installations/:id/settings - Update installation settings
func (h *PluginHandler) UpdateInstallationSettings(c *fiber.Ctx) error {
	installationID := c.Params("id")
	userID := middleware.GetUserID(c)

	installationUUID, err := uuid.Parse(installationID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid installation ID"})
	}

	installation, err := h.service.GetInstallation(installationUUID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch installation"})
	}
	if installation == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Installation not found"})
	}

	// Check permission
	hasAccess := false
	if installation.WorkspaceID != nil {
		hasAccess = h.canManageWorkspace(userID, *installation.WorkspaceID)
	} else if installation.BoardID != nil {
		hasAccess = h.canManageBoard(userID, *installation.BoardID)
	}

	if !hasAccess {
		return c.Status(403).JSON(fiber.Map{"error": "You don't have permission to update settings for this installation"})
	}

	var req models.UpdatePluginSettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.service.UpdateInstallationSettings(installationUUID, req.Settings); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true})
}
