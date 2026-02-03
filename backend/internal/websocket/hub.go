package websocket

import (
	"encoding/json"
	"sync"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/pkg/logger"
	"go.uber.org/zap"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients mapped by user ID
	clients map[uuid.UUID]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex
}

// Global hub instance
var GlobalHub *Hub

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's goroutine
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			// Close existing connection if any
			if existing, ok := h.clients[client.UserID]; ok {
				close(existing.send)
			}
			h.clients[client.UserID] = client
			logger.Info("WebSocket client registered", zap.String("userID", client.UserID.String()), zap.Int("totalClients", len(h.clients)))
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if c, ok := h.clients[client.UserID]; ok && c == client {
				delete(h.clients, client.UserID)
				close(client.send)
				logger.Info("WebSocket client unregistered", zap.String("userID", client.UserID.String()), zap.Int("totalClients", len(h.clients)))
			}
			h.mu.Unlock()
		}
	}
}

// SendNotificationToUser sends a notification to a specific user
func (h *Hub) SendNotificationToUser(userID uuid.UUID, notification models.Notification) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	logger.Info("Sending notification", zap.String("targetUserID", userID.String()), zap.Bool("userConnected", ok), zap.String("notifType", notification.Type))

	if !ok {
		logger.Warn("User not connected for notification", zap.String("userID", userID.String()))
		return // User not connected
	}

	message := WSMessage{
		Type: "notification",
		Data: notification,
	}

	data, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal notification", zap.Error(err))
		return
	}

	select {
	case client.send <- data:
		logger.Info("Notification sent to WebSocket channel", zap.String("userID", userID.String()))
	default:
		logger.Warn("Client buffer full, notification skipped", zap.String("userID", userID.String()))
	}
}

// SendNotificationsToUsers sends notifications to multiple users
func (h *Hub) SendNotificationsToUsers(notifications []models.Notification) {
	logger.Info("Broadcasting notifications", zap.Int("count", len(notifications)))
	for _, notification := range notifications {
		h.SendNotificationToUser(notification.UserID, notification)
	}
}

// IsUserConnected checks if a user is connected
func (h *Hub) IsUserConnected(userID uuid.UUID) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}

// WSMessage represents a WebSocket message
type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// InitGlobalHub initializes the global hub
func InitGlobalHub() {
	GlobalHub = NewHub()
	go GlobalHub.Run()
}

// RegisterClient registers a client with the hub
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// BroadcastToAll sends a message to all connected clients
func (h *Hub) BroadcastToAll(data interface{}) {
	message := WSMessage{
		Type: "broadcast",
		Data: data,
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal broadcast message", zap.Error(err))
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		select {
		case client.send <- jsonData:
		default:
			// Client buffer full, skip
		}
	}
}

// BroadcastInvalidation sends an invalidation event to all connected clients
// This is used by automation to notify frontend to refetch data
func (h *Hub) BroadcastInvalidation(invalidationType string, boardID, cardID uuid.UUID, extra map[string]interface{}) {
	data := map[string]interface{}{
		"invalidation_type": invalidationType,
	}
	
	if boardID != uuid.Nil {
		data["board_id"] = boardID.String()
	}
	if cardID != uuid.Nil {
		data["card_id"] = cardID.String()
	}
	if extra != nil {
		for k, v := range extra {
			data[k] = v
		}
	}

	message := WSMessage{
		Type: "invalidate",
		Data: data,
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal invalidation message", zap.Error(err))
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		select {
		case client.send <- jsonData:
		default:
			// Client buffer full, skip
		}
	}

	logger.Info("Broadcast invalidation", 
		zap.String("type", invalidationType), 
		zap.String("boardID", boardID.String()),
		zap.String("cardID", cardID.String()),
	)
}
