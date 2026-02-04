package main

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/internal/config"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/router"
	"github.com/mello/backend/internal/services"
	"github.com/mello/backend/internal/storage"
	"github.com/mello/backend/internal/websocket"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	// Set global config for singleton access
	config.SetConfig(cfg)

	// Initialize logger
	logger.Init(cfg.ServerEnv)
	defer logger.Sync()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	// Initialize MinIO storage
	if err := storage.InitMinioStorage(cfg); err != nil {
		logger.Warn("Failed to initialize MinIO storage", zap.Error(err))
	} else {
		logger.Info("MinIO storage initialized successfully")
	}

	// Initialize WebSocket hub
	websocket.InitGlobalHub()
	logger.Info("WebSocket hub initialized")

	// Start orphan cleanup service
	orphanCleanupService := services.NewOrphanCleanupService()
	orphanCleanupService.Start()
	defer orphanCleanupService.Stop()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		// Allow large file uploads (50MB max)
		BodyLimit: 50 * 1024 * 1024,
		// Enable streaming for multipart requests
		StreamRequestBody: true,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"success": false,
				"error":   err.Error(),
			})
		},
	})

	// Setup routes
	router.Setup(app, cfg)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	logger.Info("Starting server", zap.String("address", addr))

	if err := app.Listen(addr); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}
