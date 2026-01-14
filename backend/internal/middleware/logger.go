package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

func LoggerMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()

		fields := []zap.Field{
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", status),
			zap.Duration("duration", duration),
			zap.String("ip", c.IP()),
			zap.String("user_agent", c.Get("User-Agent")),
		}

		if err != nil {
			fields = append(fields, zap.Error(err))
		}

		if status >= 500 {
			logger.Error("Request failed", fields...)
		} else if status >= 400 {
			logger.Warn("Request error", fields...)
		} else {
			logger.Info("Request completed", fields...)
		}

		return err
	}
}
