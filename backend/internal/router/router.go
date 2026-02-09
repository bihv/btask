package router

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/handlers"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/services"
)

func Setup(app *fiber.App, cfg *config.Config) {
	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Logger middleware
	app.Use(middleware.LoggerMiddleware())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	// Auth routes (public)
	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Email verification (public - user clicks link from email)
	api.Get("/users/verify-email", userHandler.VerifyEmailChange)

	// Automation Service (initialize early for public schema endpoints)
	automationService := services.NewAutomationService()
	automationHandler := handlers.NewAutomationHandler(automationService)

	// Public automation schema endpoints (no auth required)
	// These are read-only schema endpoints used by the UI builder
	publicAutomation := api.Group("/automation")
	publicAutomation.Get("/triggers", automationHandler.GetAvailableTriggers)
	publicAutomation.Get("/actions", automationHandler.GetAvailableActions)
	publicAutomation.Get("/schema", automationHandler.GetAutomationSchema)
	publicAutomation.Get("/conditions/operators", automationHandler.GetConditionOperators)
	publicAutomation.Get("/conditions/fields", automationHandler.GetConditionFields)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg))

	// Load user and set isAdmin in context for all protected routes
	userRepo := handlers.NewUserHandler().GetUserRepo()
	protected.Use(func(c *fiber.Ctx) error {
		userID := middleware.GetUserID(c)
		user, err := userRepo.FindByID(userID)
		if err == nil {
			middleware.SetIsAdmin(c, user.IsAdmin)
		}
		return c.Next()
	})

	// Admin routes (requires admin middleware)
	adminHandler := handlers.NewAdminHandler()
	systemLabelHandler := handlers.NewSystemLabelHandler()
	admin := protected.Group("/admin")
	admin.Use(middleware.AdminMiddleware())
	admin.Get("/users", adminHandler.ListUsers)
	admin.Put("/users/:id/role", adminHandler.UpdateUserRole)

	// Admin label routes
	admin.Get("/labels", systemLabelHandler.GetAllLabels)

	admin.Put("/labels/:id", systemLabelHandler.UpdateLabel)
	admin.Get("/labels/export", systemLabelHandler.ExportLabels)
	admin.Post("/labels/import", systemLabelHandler.ImportLabels)

	admin.Post("/translations", systemLabelHandler.CreateTranslation)
	admin.Put("/translations/:id", systemLabelHandler.UpdateTranslation)

	// Admin template routes
	templateRepo := repository.NewTemplateRepository(database.DB)
	templateService := services.NewTemplateService(templateRepo)
	templateHandler := handlers.NewTemplateHandler(templateService)
	admin.Get("/templates", templateHandler.AdminGetAll)
	admin.Post("/templates", templateHandler.Create)
	admin.Put("/templates/:id", templateHandler.Update)
	admin.Delete("/templates/:id", templateHandler.Delete)
	admin.Put("/templates/:id/lists", templateHandler.UpdateLists)

	// Admin plugin routes
	pluginHandler := handlers.NewPluginHandler()
	admin.Get("/plugins", pluginHandler.AdminGetAll)
	admin.Delete("/plugins/:id", pluginHandler.AdminHardDelete)

	// Admin system settings routes
	systemSettingsHandler := handlers.NewSystemSettingsHandler()
	admin.Get("/settings", systemSettingsHandler.Get)
	admin.Put("/settings", systemSettingsHandler.Update)
	admin.Post("/settings/cleanup", systemSettingsHandler.RunCleanup)

	// Public template routes (authenticated users can view)
	templates := protected.Group("/templates")
	templates.Get("/", templateHandler.GetAll)
	templates.Get("/:id", templateHandler.GetByID)
	templates.Post("/:id/copy", templateHandler.IncrementCopies)
	templates.Post("/:id/use", templateHandler.UseTemplate)

	// Labels endpoint for i18n (protected to access user language preference)
	protected.Get("/labels", systemLabelHandler.GetLabels)

	// Global search endpoint
	searchHandler := handlers.NewSearchHandler()
	protected.Get("/search", searchHandler.Search)

	// User routes (automationService already initialized above for public schema endpoints)
	cardHandler := handlers.NewCardHandler(automationService)
	users := protected.Group("/users")
	users.Get("/me", userHandler.GetMe)
	users.Get("/me/cards", cardHandler.GetMyCards)
	users.Put("/me/email", userHandler.ChangeEmail)
	users.Put("/me/password", userHandler.ChangePassword)
	users.Put("/me/preferences", userHandler.UpdatePreferences)
	users.Delete("/me", userHandler.DeleteAccount)
	users.Get("/search", userHandler.Search)
	users.Get("/suggest", userHandler.Suggest)
	users.Get("/:id", userHandler.GetByID)
	users.Put("/:id", userHandler.Update)

	// Workspace routes
	workspaceHandler := handlers.NewWorkspaceHandler()
	workspaces := protected.Group("/workspaces")
	workspaces.Get("/", workspaceHandler.GetAll)
	workspaces.Post("/", workspaceHandler.Create)
	workspaces.Get("/:id", workspaceHandler.GetByID)
	workspaces.Put("/:id", workspaceHandler.Update)
	workspaces.Delete("/:id", workspaceHandler.Delete)
	workspaces.Get("/:id/members", workspaceHandler.GetMembers)
	workspaces.Post("/:id/invite", workspaceHandler.InviteMember)
	workspaces.Delete("/:id/members/:userId", workspaceHandler.RemoveMember)

	// Board routes
	boardHandler := handlers.NewBoardHandler()
	workspaces.Get("/:workspaceId/boards", boardHandler.GetByWorkspace)
	workspaces.Post("/:workspaceId/boards", boardHandler.Create)

	boards := protected.Group("/boards")
	boards.Get("/recently-viewed", boardHandler.GetRecentlyViewed)
	boards.Get("/:id", boardHandler.GetByID)
	boards.Put("/:id", boardHandler.Update)
	boards.Delete("/:id", boardHandler.Delete)
	boards.Post("/:id/watch", boardHandler.Watch)
	boards.Delete("/:id/watch", boardHandler.Unwatch)
	boards.Get("/:id/watching", boardHandler.IsWatching)
	boards.Post("/:id/copy", boardHandler.Copy)
	boards.Get("/:id/members", boardHandler.GetMembers)
	boards.Post("/:id/invite", boardHandler.InviteMember)
	boards.Delete("/:id/members/:userId", boardHandler.RemoveMember)

	// Label routes
	labelHandler := handlers.NewLabelHandler()
	boards.Get("/:boardId/labels", labelHandler.GetByBoardID)
	boards.Post("/:boardId/labels", labelHandler.Create)

	labels := protected.Group("/labels")
	labels.Put("/:id", labelHandler.Update)
	labels.Delete("/:id", labelHandler.Delete)

	// List routes
	listHandler := handlers.NewListHandler()
	boards.Post("/:boardId/lists", listHandler.Create)

	lists := protected.Group("/lists")
	lists.Put("/:id", listHandler.Update)
	lists.Delete("/:id", listHandler.Delete)
	lists.Put("/:id/move", listHandler.Move)
	lists.Post("/:id/copy", listHandler.Copy)
	lists.Post("/:id/move-all-cards", listHandler.MoveAllCards)
	lists.Post("/:id/sort-cards", listHandler.SortCards)
	lists.Put("/:id/archive", listHandler.Archive)
	lists.Put("/:id/unarchive", listHandler.Unarchive)
	lists.Post("/:id/archive-all-cards", listHandler.ArchiveAllCards)

	// Archived lists by board
	boards.Get("/:id/archived-lists", listHandler.GetArchivedLists)

	// Expand/Collapse all lists in board
	boards.Put("/:id/expand-all-lists", listHandler.ExpandAllLists)
	boards.Put("/:id/collapse-all-lists", listHandler.CollapseAllLists)

	// Card routes
	lists.Post("/:listId/cards", cardHandler.Create)

	cards := protected.Group("/cards")
	cards.Get("/:id", cardHandler.GetByID)
	cards.Put("/:id", cardHandler.Update)
	cards.Delete("/:id", cardHandler.Delete)
	cards.Put("/:id/move", cardHandler.Move)
	cards.Post("/:id/labels", cardHandler.AddLabel)
	cards.Delete("/:id/labels/:labelId", cardHandler.RemoveLabel)
	cards.Post("/:id/members", cardHandler.AddMember)
	cards.Delete("/:id/members/:userId", cardHandler.RemoveMember)
	cards.Put("/:id/archive", cardHandler.Archive)
	cards.Put("/:id/unarchive", cardHandler.Unarchive)
	cards.Post("/:id/refresh-link-preview", cardHandler.RefreshLinkPreview)
	cards.Delete("/:id/link-preview", cardHandler.ClearLinkPreview)

	// Link preview utility endpoint
	protected.Post("/link-preview", cardHandler.FetchLinkPreview)

	// Archived cards by board
	boards.Get("/:id/archived-cards", cardHandler.GetArchivedCards)

	// Custom Field routes
	customFieldHandler := handlers.NewCustomFieldHandler()
	boards.Get("/:boardId/custom-fields", customFieldHandler.GetByBoardID)
	boards.Post("/:boardId/custom-fields", customFieldHandler.Create)
	boards.Post("/:boardId/custom-fields/default", customFieldHandler.AddDefaultField)

	customFields := protected.Group("/custom-fields")
	customFields.Put("/:id", customFieldHandler.Update)
	customFields.Delete("/:id", customFieldHandler.Delete)
	customFields.Post("/:id/options", customFieldHandler.AddOption)
	customFields.Put("/options/:optionId", customFieldHandler.UpdateOption)
	customFields.Delete("/options/:optionId", customFieldHandler.DeleteOption)

	// Card Custom Field Values
	cards.Get("/:cardId/custom-fields", customFieldHandler.GetCardValues)
	cards.Put("/:cardId/custom-fields/:fieldId", customFieldHandler.SetCardValue)
	cards.Delete("/:cardId/custom-fields/:fieldId", customFieldHandler.ClearCardValue)

	// Comment routes
	commentHandler := handlers.NewCommentHandler()
	cards.Get("/:cardId/comments", commentHandler.GetByCardID)
	cards.Post("/:cardId/comments", commentHandler.Create)

	comments := protected.Group("/comments")
	comments.Put("/:id", commentHandler.Update)
	comments.Delete("/:id", commentHandler.Delete)

	// Checklist routes
	checklistHandler := handlers.NewChecklistHandler()
	cards.Get("/:cardId/checklists", checklistHandler.GetByCardID)
	cards.Post("/:cardId/checklists", checklistHandler.Create)

	checklists := protected.Group("/checklists")
	checklists.Put("/:id", checklistHandler.Update)
	checklists.Delete("/:id", checklistHandler.Delete)
	checklists.Post("/:id/items", checklistHandler.CreateItem)
	checklists.Put("/:id/items/:itemId", checklistHandler.UpdateItem)
	checklists.Delete("/:id/items/:itemId", checklistHandler.DeleteItem)
	checklists.Put("/:id/items/:itemId/toggle", checklistHandler.ToggleItem)
	checklists.Post("/:id/items/:itemId/convert-to-card", checklistHandler.ConvertItemToCard)

	// Attachment routes
	attachmentHandler := handlers.NewAttachmentHandler()
	cards.Get("/:cardId/attachments", attachmentHandler.GetByCardID)
	cards.Post("/:cardId/attachments", attachmentHandler.Create)
	cards.Post("/:cardId/attachments/sync-orphans", attachmentHandler.SyncEditorAttachments)

	attachments := protected.Group("/attachments")
	attachments.Delete("/:id", attachmentHandler.Delete)

	// Upload routes
	uploadHandler := handlers.NewUploadHandler()
	protected.Post("/upload", uploadHandler.UploadFile)

	// Notification routes
	notificationHandler := handlers.NewNotificationHandler()
	notifications := protected.Group("/notifications")
	notifications.Get("/", notificationHandler.GetNotifications)
	notifications.Get("/unread-count", notificationHandler.GetUnreadCount)
	notifications.Put("/:id/read", notificationHandler.MarkAsRead)
	notifications.Put("/:id/unread", notificationHandler.MarkAsUnread)
	notifications.Put("/read-all", notificationHandler.MarkAllAsRead)

	// List watch routes
	lists.Post("/:id/watch", notificationHandler.WatchList)
	lists.Delete("/:id/watch", notificationHandler.UnwatchList)
	lists.Get("/:id/watching", notificationHandler.IsWatching)

	// Plugin routes (protected - requires user authentication)
	plugins := protected.Group("/plugins")
	plugins.Get("/my", pluginHandler.GetMyPlugins)
	plugins.Get("/", pluginHandler.GetAll)
	plugins.Get("/:slug", pluginHandler.GetBySlug)
	plugins.Post("/", pluginHandler.Create)
	plugins.Put("/:id", pluginHandler.Update)
	plugins.Delete("/:id", pluginHandler.Delete)

	// Plugin upload route
	pluginUploadHandler := handlers.NewPluginUploadHandler()
	plugins.Post("/:id/upload", pluginUploadHandler.UploadPluginBundle)

	// Board plugin routes
	boards.Get("/:id/plugins", pluginHandler.GetBoardPlugins)
	boards.Post("/:id/plugins/:slug/install", pluginHandler.InstallToBoard)
	boards.Delete("/:id/plugins/:slug/uninstall", pluginHandler.UninstallFromBoard)
	boards.Put("/:id/plugins/:slug/settings", pluginHandler.UpdateBoardPluginSettings)

	// Workspace plugin routes
	workspaces.Get("/:id/plugins", pluginHandler.GetWorkspacePlugins)
	workspaces.Post("/:id/plugins/:slug/install", pluginHandler.InstallToWorkspace)
	workspaces.Delete("/:id/plugins/:slug/uninstall", pluginHandler.UninstallFromWorkspace)

	// Plugin Installation routes
	installations := protected.Group("/plugin-installations")
	installations.Get("/:id/settings", pluginHandler.GetInstallationSettings)
	installations.Put("/:id/settings", pluginHandler.UpdateInstallationSettings)

	// Webhook routes
	webhookHandler := handlers.NewWebhookHandler()
	plugins.Post("/:pluginId/installations/:installationId/webhooks", webhookHandler.Create)
	plugins.Get("/:pluginId/installations/:installationId/webhooks", webhookHandler.List)

	webhooks := protected.Group("/webhooks")
	webhooks.Put("/:id", webhookHandler.Update)
	webhooks.Delete("/:id", webhookHandler.Delete)
	webhooks.Get("/:id/deliveries", webhookHandler.GetDeliveries) // Keeping existing webhook routes

	// Automation Routes (protected - require auth for CRUD operations)
	automationProtected := protected.Group("/automation")
	automationProtected.Post("/rules", automationHandler.CreateRule)
	automationProtected.Put("/rules/:id", automationHandler.UpdateRule)
	automationProtected.Delete("/rules/:id", automationHandler.DeleteRule)
	automationProtected.Post("/validate", automationHandler.ValidateRule)
	boards.Get("/:boardId/automation/rules", automationHandler.GetRules)

	// Plugin Data API (requires plugin token authentication)
	pluginDataHandler := handlers.NewPluginDataHandler()
	pluginData := api.Group("/plugin-data")
	pluginData.Use(middleware.PluginAuthMiddleware())
	pluginData.Use(middleware.PluginScopeMiddleware())
	pluginData.Get("/:scope/:entityId", pluginDataHandler.GetDataByScope)
	pluginData.Get("/:scope/:entityId/:key", pluginDataHandler.GetData)
	pluginData.Put("/:scope/:entityId/:key", pluginDataHandler.SetData)
	pluginData.Delete("/:scope/:entityId/:key", pluginDataHandler.DeleteData)

	// Plugin Data Proxy (for frontend clients acting on behalf of plugins)
	pluginProxy := protected.Group("/plugin-proxy")
	pluginProxy.Get("/:pluginId/:installationId/data/:scope/:entityId/:key", pluginDataHandler.GetDataByUser)
	pluginProxy.Put("/:pluginId/:installationId/data/:scope/:entityId/:key", pluginDataHandler.SetDataByUser)

	// WebSocket route (without auth middleware, uses token query param)
	app.Use("/ws", handlers.WebSocketUpgrade)
	app.Get("/ws", websocket.New(handlers.WebSocketHandler, websocket.Config{
		Origins: []string{"*"},
	}))
}
