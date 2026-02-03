package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"encoding/json"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/automation/actions"
	"github.com/mello/backend/internal/automation/conditions"
	"github.com/mello/backend/internal/automation/triggers"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
	"github.com/mello/backend/internal/websocket"
)

type AutomationService struct {
	repo            *repository.AutomationRepository
	cardRepo        *repository.CardRepository
	listRepo        *repository.ListRepository
	boardRepo       *repository.BoardRepository
	workspaceRepo   *repository.WorkspaceRepository
	labelRepo       *repository.LabelRepository
	actionRegistry  *actions.ActionRegistry
	triggerRegistry *triggers.TriggerRegistry
}

func NewAutomationService() *AutomationService {
	cardRepo := repository.NewCardRepository()

	// Initialize action registry with built-in actions
	actions.InitBuiltinActions(cardRepo)

	// Initialize trigger registry with built-in triggers
	triggers.InitBuiltinTriggers()

	// Initialize condition engine
	conditions.InitConditionEngine()

	return &AutomationService{
		repo:            repository.NewAutomationRepository(database.DB),
		cardRepo:        cardRepo,
		listRepo:        repository.NewListRepository(),
		boardRepo:       repository.NewBoardRepository(),
		workspaceRepo:   repository.NewWorkspaceRepository(),
		labelRepo:       repository.NewLabelRepository(),
		actionRegistry:  actions.Registry(),
		triggerRegistry: triggers.Registry(),
	}
}

// CRUD Operations
func (s *AutomationService) CreateRule(userID uuid.UUID, req models.CreateAutomationRuleRequest) (*models.AutomationRule, error) {
	// Parse IDs
	var boardID *uuid.UUID
	var workspaceID *uuid.UUID

	if req.BoardID != nil {
		id, err := uuid.Parse(*req.BoardID)
		if err != nil {
			return nil, errors.New("invalid board_id")
		}
		boardID = &id
	}

	if req.WorkspaceID != nil {
		id, err := uuid.Parse(*req.WorkspaceID)
		if err != nil {
			return nil, errors.New("invalid workspace_id")
		}
		workspaceID = &id
	}

	rule := &models.AutomationRule{
		Name:          req.Name,
		Description:   req.Description,
		TriggerType:   req.TriggerType,
		TriggerConfig: req.TriggerConfig,
		Actions:       req.Actions,
		BoardID:       boardID,
		WorkspaceID:   workspaceID,
		CreatedBy:     &userID,
		IsEnabled:     true,
	}

	if err := s.repo.CreateRule(rule); err != nil {
		return nil, err
	}

	return rule, nil
}

func (s *AutomationService) GetRules(boardID uuid.UUID) ([]models.AutomationRule, error) {
	return s.repo.FindRulesByBoard(boardID)
}

func (s *AutomationService) DeleteRule(id uuid.UUID) error {
	return s.repo.DeleteRule(id)
}

func (s *AutomationService) UpdateRule(id uuid.UUID, req models.UpdateAutomationRuleRequest) (*models.AutomationRule, error) {
	rule, err := s.repo.FindRuleByID(id)
	if err != nil {
		return nil, errors.New("rule not found")
	}

	// Update only provided fields (partial update)
	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	if req.TriggerType != "" {
		rule.TriggerType = req.TriggerType
	}
	if req.TriggerConfig != nil {
		rule.TriggerConfig = req.TriggerConfig
	}
	if req.Actions != nil {
		rule.Actions = req.Actions
	}
	if req.IsEnabled != nil {
		rule.IsEnabled = *req.IsEnabled
	}

	if err := s.repo.UpdateRule(rule); err != nil {
		return nil, err
	}

	return rule, nil
}

// ==========================================
// RULE ENGINE (Core Logic)
// ==========================================

// ProcessEvent is called by other services when an event occurs
func (s *AutomationService) ProcessEvent(eventType string, boardID uuid.UUID, context map[string]interface{}) {
	go func() {
		// Find matching rules
		rules, err := s.repo.FindActiveRulesByTrigger("event", &boardID)
		if err != nil {
			log.Printf("[Automation] Failed to fetch rules: %v", err)
			return
		}

		// Create trigger context for matching
		triggerCtx := triggers.NewTriggerContext(eventType, boardID, context)

		for _, rule := range rules {
			if s.matchRule(rule, triggerCtx) {
				s.executeRule(rule, context)
			}
		}
	}()
}

func (s *AutomationService) matchRule(rule models.AutomationRule, ctx triggers.TriggerContext) bool {
	// Parse trigger config
	configBytes, _ := json.Marshal(rule.TriggerConfig)

	// First try parsing as frontend format (has "id" field)
	var frontendConfig struct {
		ID         string                   `json:"id"`
		ListID     string                   `json:"list_id"`
		Verb       string                   `json:"verb"`
		Conditions []conditions.Condition   `json:"conditions,omitempty"`
	}
	json.Unmarshal(configBytes, &frontendConfig)

	// If frontend format detected, use TriggerRegistry
	if frontendConfig.ID != "" {
		// Convert rule.TriggerConfig to map[string]interface{}
		config := make(map[string]interface{})
		for k, v := range rule.TriggerConfig {
			config[k] = v
		}
		
		// Use TriggerRegistry to match
		if !s.triggerRegistry.Match(frontendConfig.ID, ctx, config) {
			return false
		}

		// If conditions are specified, evaluate them using the new Condition Engine
		if len(frontendConfig.Conditions) > 0 {
			return s.evaluateConditions(frontendConfig.Conditions, ctx.EventData)
		}

		return true
	}

	// Fall back to legacy format (event field)
	var triggerConfig models.EventTriggerConfig
	json.Unmarshal(configBytes, &triggerConfig)

	if triggerConfig.Event != ctx.EventType {
		return false
	}

	// Check conditions if any (legacy condition handling)
	for _, condition := range triggerConfig.Conditions {
		val, exists := ctx.EventData[condition.Field]
		if !exists {
			return false
		}
		if condition.Operator == "equals" && val != condition.Value {
			return false
		}
	}

	return true
}

// evaluateConditions evaluates a list of conditions against the event data
// using the new Condition Engine.
func (s *AutomationService) evaluateConditions(conditionList []conditions.Condition, eventData map[string]interface{}) bool {
	if len(conditionList) == 0 {
		return true
	}

	ctx := &conditions.EvaluationContext{
		Data: eventData,
	}
	evaluator := conditions.NewEvaluator(ctx)

	group := &conditions.ConditionGroup{
		Logic:      conditions.LogicalAnd,
		Conditions: conditionList,
	}

	result := evaluator.Evaluate(group)
	
	// Log evaluation for debugging
	if !result.Match && result.Error != nil {
		log.Printf("[Automation] Condition evaluation error: %v", result.Error)
	}

	return result.Match
}

func (s *AutomationService) executeRule(rule models.AutomationRule, context map[string]interface{}) {
	log.Printf("[Automation] Executing rule: %s", rule.Name)

	run := &models.AutomationRun{
		RuleID:       rule.ID,
		TriggerEvent: context,
		Status:       "running",
		StartedAt:    time.Now(),
	}
	s.repo.CreateRun(run)

	// Execute Actions using the new ActionRegistry
	var executed []interface{}
	var errs []string

	for _, actionRaw := range rule.Actions {
		// Decode action - support both frontend format (id) and backend format (type)
		actionBytes, _ := json.Marshal(actionRaw)
		var baseAction struct {
			Type string `json:"type"`
			ID   string `json:"id"`
		}
		json.Unmarshal(actionBytes, &baseAction)

		// Use ID as fallback if Type is empty (frontend format)
		actionType := baseAction.Type
		if actionType == "" {
			actionType = baseAction.ID
		}

		// Build ActionContext from the trigger context
		actionCtx := s.buildActionContext(context, actionRaw)

		// Execute via ActionRegistry (replaces the switch-case)
		result := s.actionRegistry.Execute(actionType, actionCtx)

		if !result.Success {
			errMsg := result.Message
			if result.Error != nil {
				errMsg = result.Error.Error()
			}
			errs = append(errs, errMsg)
		} else {
			executed = append(executed, map[string]interface{}{
				"type":    actionType,
				"message": result.Message,
				"data":    result.Data,
			})
		}
	}

	// Update Run Status
	status := "success"
	if len(errs) > 0 {
		if len(executed) > 0 {
			status = "partial" // Some succeeded, some failed
		} else {
			status = "failed"
		}
		run.ErrorMessage = fmt.Sprintf("%v", errs)
	}
	run.Status = status
	now := time.Now()
	run.CompletedAt = &now
	run.ActionsExecuted = models.JSONArray(executed)

	if err := s.repo.UpdateRun(run); err != nil {
		log.Printf("[Automation] Failed to update run status: %v", err)
	}

	// Update rule statistics
	rule.RunCount++
	rule.LastRunAt = &now
	if len(errs) > 0 {
		rule.LastError = fmt.Sprintf("%v", errs)
	} else {
		rule.LastError = ""
	}
	if err := s.repo.UpdateRule(&rule); err != nil {
		log.Printf("[Automation] Failed to update rule statistics: %v", err)
	}

	log.Printf("[Automation] Rule finished: %s (%s) - %d actions executed, %d errors",
		rule.Name, status, len(executed), len(errs))

	// Broadcast invalidation to frontend so it can refetch board/card data
	if len(executed) > 0 && websocket.GlobalHub != nil {
		boardID := uuid.Nil
		cardID := uuid.Nil
		
		// Extract board_id and card_id from trigger context
		if bidStr, ok := context["board_id"].(string); ok {
			boardID, _ = uuid.Parse(bidStr)
		}
		if cidStr, ok := context["card_id"].(string); ok {
			cardID, _ = uuid.Parse(cidStr)
		}
		
		websocket.GlobalHub.BroadcastInvalidation("automation", boardID, cardID, map[string]interface{}{
			"rule_id":   rule.ID.String(),
			"rule_name": rule.Name,
			"actions":   len(executed),
		})
	}
}

// buildActionContext creates an ActionContext from the trigger context and action config
func (s *AutomationService) buildActionContext(triggerContext map[string]interface{}, actionConfig interface{}) actions.ActionContext {
	ctx := actions.ActionContext{
		TriggerData: triggerContext,
		Config:      make(map[string]interface{}),
	}

	// Parse card_id
	if cardIDStr, ok := triggerContext["card_id"].(string); ok {
		if cardID, err := uuid.Parse(cardIDStr); err == nil {
			ctx.CardID = cardID
		}
	}

	// Parse list_id
	if listIDStr, ok := triggerContext["list_id"].(string); ok {
		if listID, err := uuid.Parse(listIDStr); err == nil {
			ctx.ListID = listID
		}
	}

	// Parse board_id
	if boardIDStr, ok := triggerContext["board_id"].(string); ok {
		if boardID, err := uuid.Parse(boardIDStr); err == nil {
			ctx.BoardID = boardID
		}
	}

	// Parse user_id (who triggered)
	if userIDStr, ok := triggerContext["user_id"].(string); ok {
		if userID, err := uuid.Parse(userIDStr); err == nil {
			ctx.UserID = userID
		}
	}

	// Extract action config
	if configMap, ok := actionConfig.(map[string]interface{}); ok {
		ctx.Config = configMap
	}

	return ctx
}

// ==========================================
// REGISTRY API (For Frontend UI)
// ==========================================

// GetAvailableActions returns all registered actions with their schemas.
// This can be used by the frontend to build the automation UI.
func (s *AutomationService) GetAvailableActions() []actions.ActionInfo {
	return s.actionRegistry.ListActionInfos()
}

// GetAvailableTriggers returns all registered triggers with their schemas.
// This can be used by the frontend to build the automation UI.
func (s *AutomationService) GetAvailableTriggers() []triggers.TriggerInfo {
	return s.triggerRegistry.ListTriggerInfos()
}

// GetAutomationSchema returns both triggers and actions for the automation builder UI.
func (s *AutomationService) GetAutomationSchema() map[string]interface{} {
	return map[string]interface{}{
		"triggers": s.triggerRegistry.ListTriggerInfos(),
		"actions":  s.actionRegistry.ListActionInfos(),
	}
}

// ValidateActionConfig validates an action configuration against its schema.
func (s *AutomationService) ValidateActionConfig(actionID string, config map[string]interface{}) error {
	return s.actionRegistry.Validate(actionID, config)
}

// ValidateTriggerConfig validates a trigger configuration against its schema.
func (s *AutomationService) ValidateTriggerConfig(triggerID string, config map[string]interface{}) error {
	return s.triggerRegistry.Validate(triggerID, config)
}

// ==========================================
// CONDITION ENGINE API
// ==========================================

// GetAvailableConditionOperators returns all available condition operators.
func (s *AutomationService) GetAvailableConditionOperators() []conditions.OperatorInfo {
	return conditions.GetAvailableOperators()
}

// GetAvailableConditionFields returns available fields for conditions based on context.
func (s *AutomationService) GetAvailableConditionFields(contextType string) []conditions.FieldInfo {
	return conditions.GetAvailableFields(contextType)
}

// GetConditionSchema returns the JSON schema for building conditions in the UI.
func (s *AutomationService) GetConditionSchema() map[string]interface{} {
	return conditions.GetConditionSchema()
}

// GetFullAutomationSchema returns the complete schema including triggers, actions, and conditions.
func (s *AutomationService) GetFullAutomationSchema() map[string]interface{} {
	return map[string]interface{}{
		"triggers":   s.triggerRegistry.ListTriggerInfos(),
		"actions":    s.actionRegistry.ListActionInfos(),
		"conditions": map[string]interface{}{
			"operators": conditions.GetAvailableOperators(),
			"schema":    conditions.GetConditionSchema(),
			"fields": map[string]interface{}{
				"card":  conditions.GetAvailableFields("card"),
				"list":  conditions.GetAvailableFields("list"),
				"board": conditions.GetAvailableFields("board"),
				"user":  conditions.GetAvailableFields("user"),
			},
		},
	}
}

// ValidateRuleConfig validates the entire rule configuration including triggers, actions, and conditions.
func (s *AutomationService) ValidateRuleConfig(req models.CreateAutomationRuleRequest) []error {
	var errs []error

	// Validate trigger config
	if triggerID, ok := req.TriggerConfig["id"].(string); ok {
		config := make(map[string]interface{})
		for k, v := range req.TriggerConfig {
			config[k] = v
		}
		if err := s.triggerRegistry.Validate(triggerID, config); err != nil {
			errs = append(errs, fmt.Errorf("trigger validation: %w", err))
		}
	}

	// Validate actions
	for i, actionRaw := range req.Actions {
		if actionMap, ok := actionRaw.(map[string]interface{}); ok {
			actionID := ""
			if id, ok := actionMap["id"].(string); ok {
				actionID = id
			} else if id, ok := actionMap["type"].(string); ok {
				actionID = id
			}
			if actionID != "" {
				if err := s.actionRegistry.Validate(actionID, actionMap); err != nil {
					errs = append(errs, fmt.Errorf("action[%d] validation: %w", i, err))
				}
			}
		}
	}

	// Validate conditions if present
	if conditionsRaw, ok := req.TriggerConfig["conditions"]; ok {
		if conditionsArray, ok := conditionsRaw.([]interface{}); ok {
			for i, condRaw := range conditionsArray {
				condBytes, _ := json.Marshal(condRaw)
				var cond conditions.Condition
				if err := json.Unmarshal(condBytes, &cond); err != nil {
					errs = append(errs, fmt.Errorf("condition[%d] parse error: %w", i, err))
					continue
				}
				if err := conditions.ValidateCondition(&cond); err != nil {
					errs = append(errs, fmt.Errorf("condition[%d]: %w", i, err))
				}
			}
		}
	}

	return errs
}

