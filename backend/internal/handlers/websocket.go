package handlers

import (
	"github.com/btask/backend/internal/middleware"
	ws "github.com/btask/backend/internal/websocket"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

// WebSocketHandler handles WebSocket connections
func WebSocketHandler(c *websocket.Conn) {
	// Get user ID from context (set by middleware)
	userID := middleware.GetUserIDFromWS(c)
	if userID.String() == "00000000-0000-0000-0000-000000000000" {
		c.Close()
		return
	}

	client := ws.NewClient(ws.GlobalHub, c, userID)
	ws.GlobalHub.RegisterClient(client)

	// Start goroutines for reading and writing
	go client.WritePump()
	client.ReadPump()
}

// WebSocketUpgrade is middleware to upgrade HTTP to WebSocket
func WebSocketUpgrade(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}
