package repository

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type WebhookRepository struct {
	db *gorm.DB
}

func NewWebhookRepository(db *gorm.DB) *WebhookRepository {
	return &WebhookRepository{db: db}
}

// Webhook CRUD
func (r *WebhookRepository) Create(webhook *models.PluginWebhook) error {
	return r.db.Create(webhook).Error
}

func (r *WebhookRepository) FindByID(id uuid.UUID) (*models.PluginWebhook, error) {
	var webhook models.PluginWebhook
	err := r.db.
		Preload("Plugin").
		Preload("Installation").
		First(&webhook, "id = ?", id).Error
	
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &webhook, err
}

func (r *WebhookRepository) FindByPlugin(pluginID uuid.UUID) ([]models.PluginWebhook, error) {
	var webhooks []models.PluginWebhook
	err := r.db.Where("plugin_id = ?", pluginID).Find(&webhooks).Error
	return webhooks, err
}

func (r *WebhookRepository) FindByInstallation(installationID uuid.UUID) ([]models.PluginWebhook, error) {
	var webhooks []models.PluginWebhook
	err := r.db.Where("installation_id = ?", installationID).Find(&webhooks).Error
	return webhooks, err
}

func (r *WebhookRepository) FindActiveByEvent(event string) ([]models.PluginWebhook, error) {
	var webhooks []models.PluginWebhook
	err := r.db.
		Preload("Plugin").
		Preload("Installation").
		Where("is_active = ? AND ? = ANY(events)", true, event).
		Find(&webhooks).Error
	return webhooks, err
}

func (r *WebhookRepository) Update(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&models.PluginWebhook{}).Where("id = ?", id).Updates(updates).Error
}

func (r *WebhookRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.PluginWebhook{}, "id = ?", id).Error
}

func (r *WebhookRepository) UpdateStatus(id uuid.UUID, isSuccess bool, errorMsg string) error {
	updates := map[string]interface{}{
		"last_triggered_at": time.Now(),
	}

	if isSuccess {
		updates["last_success_at"] = time.Now()
		updates["failure_count"] = 0
	} else {
		updates["failure_count"] = gorm.Expr("failure_count + ?", 1)
		updates["last_error"] = errorMsg
	}

	return r.db.Model(&models.PluginWebhook{}).Where("id = ?", id).Updates(updates).Error
}

func (r *WebhookRepository) DisableFailedWebhooks(maxFailures int) error {
	return r.db.Model(&models.PluginWebhook{}).
		Where("failure_count >= ?", maxFailures).
		Update("is_active", false).Error
}

// Webhook Delivery operations
func (r *WebhookRepository) CreateDelivery(delivery *models.WebhookDelivery) error {
	return r.db.Create(delivery).Error
}

func (r *WebhookRepository) FindDeliveryByID(id uuid.UUID) (*models.WebhookDelivery, error) {
	var delivery models.WebhookDelivery
	err := r.db.Preload("Webhook").First(&delivery, "id = ?", id).Error
	
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &delivery, err
}

func (r *WebhookRepository) FindDeliveriesByWebhook(webhookID uuid.UUID, limit int) ([]models.WebhookDelivery, error) {
	var deliveries []models.WebhookDelivery
	err := r.db.
		Where("webhook_id = ?", webhookID).
		Order("created_at DESC").
		Limit(limit).
		Find(&deliveries).Error
	return deliveries, err
}

func (r *WebhookRepository) FindPendingDeliveries(limit int) ([]models.WebhookDelivery, error) {
	var deliveries []models.WebhookDelivery
	err := r.db.
		Preload("Webhook").
		Preload("Webhook.Plugin").
		Where("status = ?", "pending").
		Order("created_at ASC").
		Limit(limit).
		Find(&deliveries).Error
	return deliveries, err
}

func (r *WebhookRepository) FindRetryableDeliveries(limit int) ([]models.WebhookDelivery, error) {
	var deliveries []models.WebhookDelivery
	err := r.db.
		Preload("Webhook").
		Preload("Webhook.Plugin").
		Where("status = ? AND next_retry_at <= ?", "retrying", time.Now()).
		Order("next_retry_at ASC").
		Limit(limit).
		Find(&deliveries).Error
	return deliveries, err
}

func (r *WebhookRepository) UpdateDeliveryStatus(id uuid.UUID, status string, responseStatus int, responseBody string, responseTime int) error {
	updates := map[string]interface{}{
		"status":          status,
		"response_status": responseStatus,
		"response_body":   responseBody,
		"response_time_ms": responseTime,
		"attempt_count":   gorm.Expr("attempt_count + ?", 1),
	}

	return r.db.Model(&models.WebhookDelivery{}).Where("id = ?", id).Updates(updates).Error
}

func (r *WebhookRepository) ScheduleRetry(id uuid.UUID, nextRetryAt time.Time) error {
	updates := map[string]interface{}{
		"status":        "retrying",
		"next_retry_at": nextRetryAt,
		"attempt_count": gorm.Expr("attempt_count + ?", 1),
	}

	return r.db.Model(&models.WebhookDelivery{}).Where("id = ?", id).Updates(updates).Error
}

func (r *WebhookRepository) DeleteOldDeliveries(olderThan time.Time) error {
	return r.db.Where("created_at < ? AND status IN (?)", olderThan, []string{"success", "failed"}).
		Delete(&models.WebhookDelivery{}).Error
}
