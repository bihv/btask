package router

import (
	"github.com/btask/backend/internal/config"
	"github.com/btask/backend/internal/handlers"
	"github.com/btask/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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
	users := protected.Group("/users")
	users.Get("/me", userHandler.GetMe)
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
	workspaces.Post("/:id/members", workspaceHandler.AddMember)
	workspaces.Delete("/:id/members/:userId", workspaceHandler.RemoveMember)

	// Board routes
	boardHandler := handlers.NewBoardHandler()
	workspaces.Get("/:workspaceId/boards", boardHandler.GetByWorkspace)
	workspaces.Post("/:workspaceId/boards", boardHandler.Create)

	boards := protected.Group("/boards")
	boards.Get("/:id", boardHandler.GetByID)
	boards.Put("/:id", boardHandler.Update)
	boards.Delete("/:id", boardHandler.Delete)

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

	// Card routes
	cardHandler := handlers.NewCardHandler()
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

	// Comment routes
	commentHandler := handlers.NewCommentHandler()
	cards.Get("/:cardId/comments", commentHandler.GetByCardID)
	cards.Post("/:cardId/comments", commentHandler.Create)

	comments := protected.Group("/comments")
	comments.Put("/:id", commentHandler.Update)
	comments.Delete("/:id", commentHandler.Delete)

	// Upload routes
	uploadHandler := handlers.NewUploadHandler()
	protected.Post("/upload", uploadHandler.UploadFile)
}
