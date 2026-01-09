package main

import (
	"fmt"

	"github.com/btask/backend/internal/config"
	"github.com/btask/backend/internal/database"
	"github.com/btask/backend/internal/router"
	"github.com/btask/backend/internal/storage"
	"github.com/btask/backend/pkg/logger"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

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

	// Create Fiber app
	app := fiber.New(fiber.Config{
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
