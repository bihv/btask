package queue

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
)

// Job types for automation.
const (
	JobTypeAutomationRule = "automation_rule"
	JobTypeWebhook        = "webhook"
	JobTypePluginAction   = "plugin_action"
	JobTypeNotification   = "notification"
)

// AutomationPayload is the payload structure for automation rule jobs.
type AutomationPayload struct {
	RuleID      uuid.UUID              `json:"rule_id"`
	BoardID     uuid.UUID              `json:"board_id"`
	TriggerData map[string]interface{} `json:"trigger_data"`
	Actions     []interface{}          `json:"actions"`
}

// AutomationHandler handles automation rule execution jobs.
// This should be set by the automation service during initialization.
var AutomationHandler func(ctx context.Context, ruleID uuid.UUID, boardID uuid.UUID, triggerData map[string]interface{}) error

// RegisterAutomationHandlers registers the built-in job handlers.
func RegisterAutomationHandlers(queue *JobQueue) {
	queue.RegisterHandler(JobTypeAutomationRule, handleAutomationRule)
	queue.RegisterHandler(JobTypeWebhook, handleWebhook)
	queue.RegisterHandler(JobTypePluginAction, handlePluginAction)
	queue.RegisterHandler(JobTypeNotification, handleNotification)
}

// handleAutomationRule processes automation rule execution jobs.
func handleAutomationRule(ctx context.Context, job *Job) error {
	log.Printf("[AutomationJob] Processing rule job: %s", job.ID)

	// Extract payload
	ruleIDStr, ok := job.Payload["rule_id"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid rule_id in payload")
	}

	ruleID, err := uuid.Parse(ruleIDStr)
	if err != nil {
		return fmt.Errorf("invalid rule_id format: %v", err)
	}

	triggerData, ok := job.Payload["trigger_data"].(map[string]interface{})
	if !ok {
		triggerData = job.Payload // Fallback to entire payload
	}

	// Call the registered automation handler
	if AutomationHandler != nil {
		return AutomationHandler(ctx, ruleID, job.BoardID, triggerData)
	}

	return fmt.Errorf("automation handler not registered")
}

// handleWebhook processes webhook delivery jobs.
func handleWebhook(ctx context.Context, job *Job) error {
	log.Printf("[WebhookJob] Processing webhook job: %s", job.ID)

	url, ok := job.Payload["url"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid url in payload")
	}

	// TODO: Implement webhook delivery using HTTP client
	log.Printf("[WebhookJob] Would deliver to: %s", url)

	return nil
}

// handlePluginAction processes plugin action execution jobs.
func handlePluginAction(ctx context.Context, job *Job) error {
	log.Printf("[PluginJob] Processing plugin action job: %s", job.ID)

	pluginID, ok := job.Payload["plugin_id"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid plugin_id in payload")
	}

	actionID, ok := job.Payload["action_id"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid action_id in payload")
	}

	// TODO: Implement plugin action execution
	log.Printf("[PluginJob] Would execute plugin %s action %s", pluginID, actionID)

	return nil
}

// handleNotification processes notification jobs.
func handleNotification(ctx context.Context, job *Job) error {
	log.Printf("[NotificationJob] Processing notification job: %s", job.ID)

	// TODO: Implement notification delivery
	return nil
}

// NewAutomationJob creates a job for automation rule execution.
func NewAutomationJob(ruleID, boardID uuid.UUID, triggerData map[string]interface{}) *Job {
	job := NewJob(JobTypeAutomationRule, map[string]interface{}{
		"rule_id":      ruleID.String(),
		"trigger_data": triggerData,
	})
	job.BoardID = boardID
	job.RuleID = &ruleID
	return job
}

// NewWebhookJob creates a job for webhook delivery.
func NewWebhookJob(url string, payload map[string]interface{}, boardID uuid.UUID) *Job {
	job := NewJob(JobTypeWebhook, map[string]interface{}{
		"url":     url,
		"payload": payload,
	})
	job.BoardID = boardID
	return job
}

// NewPluginActionJob creates a job for plugin action execution.
func NewPluginActionJob(pluginID, actionID string, config map[string]interface{}, boardID uuid.UUID) *Job {
	job := NewJob(JobTypePluginAction, map[string]interface{}{
		"plugin_id": pluginID,
		"action_id": actionID,
		"config":    config,
	})
	job.BoardID = boardID
	return job
}
