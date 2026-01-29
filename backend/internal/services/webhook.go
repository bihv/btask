package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

// Event types for webhooks
const (
	EventCardCreated        = "card:created"
	EventCardUpdated        = "card:updated"
	EventCardDeleted        = "card:deleted"
	EventCardMoved          = "card:moved"
	EventCardArchived       = "card:archived"
	EventCommentCreated     = "comment:created"
	EventChecklistCompleted = "checklist:completed"
)

// WebhookService handles webhook business logic
type WebhookService struct {
	webhookRepo *repository.WebhookRepository
	httpClient  *http.Client
}

// NewWebhookService creates a new webhook service
func NewWebhookService(webhookRepo *repository.WebhookRepository) *WebhookService {
	return &WebhookService{
		webhookRepo: webhookRepo,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateWebhook creates a new webhook subscription
func (s *WebhookService) CreateWebhook(req *models.CreateWebhookRequest, pluginID, installationID uuid.UUID) (*models.PluginWebhook, error) {
	var boardID *uuid.UUID
	if req.BoardID != nil && *req.BoardID != "" {
		parsed, err := uuid.Parse(*req.BoardID)
		if err == nil {
			boardID = &parsed
		}
	}

	webhook := &models.PluginWebhook{
		PluginID:       pluginID,
		InstallationID: installationID,
		CallbackURL:    req.CallbackURL,
		Secret:         req.Secret,
		Events:         pq.StringArray(req.Events),
		BoardID:        boardID,
		IsActive:       true,
	}

	if err := s.webhookRepo.Create(webhook); err != nil {
		return nil, fmt.Errorf("failed to create webhook: %w", err)
	}

	return webhook, nil
}

// GetWebhooksByInstallation returns webhooks for an installation
func (s *WebhookService) GetWebhooksByInstallation(installationID uuid.UUID) ([]models.PluginWebhook, error) {
	return s.webhookRepo.FindByInstallation(installationID)
}

// GetWebhook returns a webhook by ID
func (s *WebhookService) GetWebhook(id uuid.UUID) (*models.PluginWebhook, error) {
	return s.webhookRepo.FindByID(id)
}

// UpdateWebhook updates a webhook
func (s *WebhookService) UpdateWebhook(id uuid.UUID, req *models.UpdateWebhookRequest) error {
	updates := make(map[string]interface{})

	if req.CallbackURL != "" {
		updates["callback_url"] = req.CallbackURL
	}
	if req.Secret != "" {
		updates["secret"] = req.Secret
	}
	if len(req.Events) > 0 {
		updates["events"] = pq.StringArray(req.Events)
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	return s.webhookRepo.Update(id, updates)
}

// DeleteWebhook deletes a webhook
func (s *WebhookService) DeleteWebhook(id uuid.UUID) error {
	return s.webhookRepo.Delete(id)
}

// GetDeliveries returns delivery history for a webhook
func (s *WebhookService) GetDeliveries(webhookID uuid.UUID, limit int) ([]models.WebhookDelivery, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.webhookRepo.FindDeliveriesByWebhook(webhookID, limit)
}

// WebhookPayload represents the payload sent to webhook callbacks
type WebhookPayload struct {
	Event          string                 `json:"event"`
	Timestamp      time.Time              `json:"timestamp"`
	InstallationID string                 `json:"installation_id"`
	Data           map[string]interface{} `json:"data"`
}

// TriggerEvent fires webhooks for a specific event
func (s *WebhookService) TriggerEvent(event string, boardID *uuid.UUID, data map[string]interface{}) {
	// Find active webhooks subscribed to this event
	webhooks, err := s.webhookRepo.FindActiveByEvent(event)
	if err != nil {
		fmt.Printf("[Webhook] Failed to find webhooks for event %s: %v\n", event, err)
		return
	}

	for _, webhook := range webhooks {
		// If webhook is scoped to a board, check if it matches
		if webhook.BoardID != nil && boardID != nil && *webhook.BoardID != *boardID {
			continue
		}

		// Create delivery record
		delivery := &models.WebhookDelivery{
			WebhookID: webhook.ID,
			EventType: event,
			Payload: models.JSONMap{
				"event":           event,
				"timestamp":       time.Now().UTC().Format(time.RFC3339),
				"installation_id": webhook.InstallationID.String(),
				"data":            data,
			},
			Status: "pending",
		}

		if err := s.webhookRepo.CreateDelivery(delivery); err != nil {
			fmt.Printf("[Webhook] Failed to create delivery: %v\n", err)
			continue
		}

		// Process delivery asynchronously
		go s.processDelivery(delivery, &webhook)
	}
}

// processDelivery sends the webhook payload to the callback URL
func (s *WebhookService) processDelivery(delivery *models.WebhookDelivery, webhook *models.PluginWebhook) {
	startTime := time.Now()

	// Prepare payload
	payloadBytes, err := json.Marshal(delivery.Payload)
	if err != nil {
		s.updateDeliveryFailed(delivery.ID, webhook.ID, "failed", 0, err.Error(), 0)
		return
	}

	// Create request
	req, err := http.NewRequest("POST", webhook.CallbackURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		s.updateDeliveryFailed(delivery.ID, webhook.ID, "failed", 0, err.Error(), 0)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Mello-Event", delivery.EventType)
	req.Header.Set("X-Mello-Delivery", delivery.ID.String())

	// Sign the payload with HMAC-SHA256
	signature := s.signPayload(payloadBytes, webhook.Secret)
	req.Header.Set("X-Mello-Signature", signature)

	// Send request
	resp, err := s.httpClient.Do(req)
	responseTime := int(time.Since(startTime).Milliseconds())

	if err != nil {
		s.updateDeliveryFailed(delivery.ID, webhook.ID, "failed", 0, err.Error(), responseTime)
		s.scheduleRetryIfNeeded(delivery)
		return
	}
	defer resp.Body.Close()

	// Read response body (limit to 1KB)
	var responseBody string
	bodyBuf := make([]byte, 1024)
	n, _ := resp.Body.Read(bodyBuf)
	responseBody = string(bodyBuf[:n])

	// Determine status
	status := "success"
	if resp.StatusCode >= 400 {
		status = "failed"
		s.scheduleRetryIfNeeded(delivery)
	}

	// Update delivery status
	s.webhookRepo.UpdateDeliveryStatus(delivery.ID, status, resp.StatusCode, responseBody, responseTime)
	s.webhookRepo.UpdateStatus(webhook.ID, status == "success", responseBody)
}

// signPayload creates HMAC-SHA256 signature
func (s *WebhookService) signPayload(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

// updateDeliveryFailed updates a failed delivery
func (s *WebhookService) updateDeliveryFailed(deliveryID, webhookID uuid.UUID, status string, statusCode int, errorMsg string, responseTime int) {
	s.webhookRepo.UpdateDeliveryStatus(deliveryID, status, statusCode, errorMsg, responseTime)
	s.webhookRepo.UpdateStatus(webhookID, false, errorMsg)
}

// scheduleRetryIfNeeded schedules a retry for failed delivery
func (s *WebhookService) scheduleRetryIfNeeded(delivery *models.WebhookDelivery) {
	// Exponential backoff: 1min, 5min, 30min, 2h, 24h
	delays := []time.Duration{
		1 * time.Minute,
		5 * time.Minute,
		30 * time.Minute,
		2 * time.Hour,
		24 * time.Hour,
	}

	if delivery.AttemptCount >= len(delays) {
		// Max retries reached
		return
	}

	nextRetry := time.Now().Add(delays[delivery.AttemptCount])
	s.webhookRepo.ScheduleRetry(delivery.ID, nextRetry)
}

// ProcessPendingDeliveries processes pending and retryable deliveries (called by background worker)
func (s *WebhookService) ProcessPendingDeliveries() {
	// Process retryable deliveries
	deliveries, err := s.webhookRepo.FindRetryableDeliveries(10)
	if err != nil {
		fmt.Printf("[Webhook] Failed to find retryable deliveries: %v\n", err)
		return
	}

	for _, delivery := range deliveries {
		go s.processDelivery(&delivery, &delivery.Webhook)
	}
}

// CleanupOldDeliveries removes old delivery records
func (s *WebhookService) CleanupOldDeliveries(olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)
	return s.webhookRepo.DeleteOldDeliveries(cutoff)
}
