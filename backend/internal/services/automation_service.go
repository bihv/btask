package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"encoding/json"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/database"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type AutomationService struct {
	repo          *repository.AutomationRepository
	cardRepo      *repository.CardRepository
	listRepo      *repository.ListRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
	labelRepo     *repository.LabelRepository
}

func NewAutomationService() *AutomationService {
	return &AutomationService{
		repo:          repository.NewAutomationRepository(database.DB),
		cardRepo:      repository.NewCardRepository(),
		listRepo:      repository.NewListRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
		labelRepo:     repository.NewLabelRepository(),
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

		for _, rule := range rules {
			if s.matchRule(rule, eventType, context) {
				s.executeRule(rule, context)
			}
		}
	}()
}

func (s *AutomationService) matchRule(rule models.AutomationRule, eventType string, context map[string]interface{}) bool {
	// 1. Check Event Type
	configBytes, _ := json.Marshal(rule.TriggerConfig)
	var triggerConfig models.EventTriggerConfig
	json.Unmarshal(configBytes, &triggerConfig)

	if triggerConfig.Event != eventType {
		return false
	}

	// 2. Check Conditions (Phase 3 placeholder)
	// For now, we assume simple matching (e.g. if event is "card.moved", check if destination list matches)

	// Example: If rule triggers on "Move to Done", we check context["list_name"] == "Done" or context["list_id"] == target_list_id
	// This requires more complex logic. For Phase 1, we trust the eventType match or implement strict match.
	// Let's implement a simple condition checker if conditions exist.

	for _, condition := range triggerConfig.Conditions {
		val, exists := context[condition.Field]
		if !exists {
			return false
		}

		// Simple string comparison for now
		if condition.Operator == "equals" && val != condition.Value {
			return false
		}
	}

	return true
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

	// Execute Actions
	var executed []interface{}
	var errs []string

	for _, actionRaw := range rule.Actions {
		// Decode action
		actionBytes, _ := json.Marshal(actionRaw)
		var baseAction struct {
			Type string `json:"type"`
		}
		json.Unmarshal(actionBytes, &baseAction)

		var err error
		switch baseAction.Type {
		case "move_card":
			var action models.MoveCardAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeMoveCard(action, context)
		case "add_label":
			var action models.AddLabelAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeAddLabel(action, context)
		case "archive_card":
			err = s.executeArchiveCard(context)
			// Add more actions here
		}

		if err != nil {
			errs = append(errs, err.Error())
		} else {
			executed = append(executed, baseAction)
		}
	}

	// Update Run Status
	status := "success"
	if len(errs) > 0 {
		status = "failed"
		run.ErrorMessage = fmt.Sprintf("%v", errs)
	}
	run.Status = status
	now := time.Now()
	run.CompletedAt = &now
	run.ActionsExecuted = models.JSONArray(executed)

	if err := s.repo.UpdateRun(run); err != nil {
		log.Printf("[Automation] Failed to update run status: %v", err)
	}

	log.Printf("[Automation] Rule finished: %s (%s)", rule.Name, status)
}

// ==========================================
// ACTION EXECUTORS
// ==========================================

func (s *AutomationService) executeMoveCard(action models.MoveCardAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)

	targetListID, _ := uuid.Parse(action.ListID)

	// Calculate new position (append to end)
	maxPos := s.cardRepo.GetMaxPosition(targetListID)
	newPos := maxPos + 1

	return s.cardRepo.MoveCard(cardID, targetListID, newPos)
}

func (s *AutomationService) executeAddLabel(action models.AddLabelAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	labelID, _ := uuid.Parse(action.LabelID)

	return s.cardRepo.AddLabel(cardID, labelID)
}

func (s *AutomationService) executeArchiveCard(context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	return s.cardRepo.Archive(cardID)
}
