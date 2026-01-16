package router

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/handlers"
	"github.com/mello/backend/internal/middleware"
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
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg))

	// User routes
	userHandler := handlers.NewUserHandler()
	cardHandler := handlers.NewCardHandler()
	users := protected.Group("/users")
	users.Get("/me", userHandler.GetMe)
	users.Get("/me/cards", cardHandler.GetMyCards)
	users.Get("/search", userHandler.Search)
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
	boards.Get("/:id", boardHandler.GetByID)
	boards.Put("/:id", boardHandler.Update)
	boards.Delete("/:id", boardHandler.Delete)
	boards.Post("/:id/watch", boardHandler.Watch)
	boards.Delete("/:id/watch", boardHandler.Unwatch)
	boards.Get("/:id/watching", boardHandler.IsWatching)
	boards.Post("/:id/copy", boardHandler.Copy)

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

	// WebSocket route (without auth middleware, uses token query param)
	app.Use("/ws", handlers.WebSocketUpgrade)
	app.Get("/ws", websocket.New(handlers.WebSocketHandler))
}
