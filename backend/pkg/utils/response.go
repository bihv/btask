package utils

import "github.com/gofiber/fiber/v2"

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func SuccessResponse(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
	})
}

func SuccessMessageResponse(c *fiber.Ctx, message string) error {
	return c.JSON(Response{
		Success: true,
		Message: message,
	})
}

func ErrorResponse(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(Response{
		Success: false,
		Error:   message,
	})
}

func ValidationErrorResponse(c *fiber.Ctx, message string) error {
	return ErrorResponse(c, fiber.StatusBadRequest, message)
}

func UnauthorizedResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Unauthorized"
	}
	return ErrorResponse(c, fiber.StatusUnauthorized, message)
}

func NotFoundResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Resource not found"
	}
	return ErrorResponse(c, fiber.StatusNotFound, message)
}

func InternalErrorResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Internal server error"
	}
	return ErrorResponse(c, fiber.StatusInternalServerError, message)
}
