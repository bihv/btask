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

func (s *AutomationService) UpdateRule(id uuid.UUID, req models.CreateAutomationRuleRequest) (*models.AutomationRule, error) {
	rule, err := s.repo.FindRuleByID(id)
	if err != nil {
		return nil, errors.New("rule not found")
	}

	// Update fields
	rule.Name = req.Name
	rule.Description = req.Description
	rule.TriggerType = req.TriggerType
	rule.TriggerConfig = req.TriggerConfig
	rule.Actions = req.Actions

	// Update BoardID/WorkspaceID only if provided (though usually these don't move)
	if req.BoardID != nil {
		bid, err := uuid.Parse(*req.BoardID)
		if err == nil {
			rule.BoardID = &bid
		}
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

		for _, rule := range rules {
			if s.matchRule(rule, eventType, context) {
				s.executeRule(rule, context)
			}
		}
	}()
}

func (s *AutomationService) matchRule(rule models.AutomationRule, eventType string, context map[string]interface{}) bool {
	// Parse trigger config
	configBytes, _ := json.Marshal(rule.TriggerConfig)

	// First try parsing as frontend format (has "id" field)
	var frontendConfig struct {
		ID     string `json:"id"`
		ListID string `json:"list_id"`
		Verb   string `json:"verb"`
	}
	json.Unmarshal(configBytes, &frontendConfig)

	// If frontend format detected, use trigger ID mapping
	if frontendConfig.ID != "" {
		return s.matchFrontendTrigger(frontendConfig.ID, eventType, context, rule.TriggerConfig)
	}

	// Fall back to legacy format (event field)
	var triggerConfig models.EventTriggerConfig
	json.Unmarshal(configBytes, &triggerConfig)

	if triggerConfig.Event != eventType {
		return false
	}

	// Check conditions if any
	for _, condition := range triggerConfig.Conditions {
		val, exists := context[condition.Field]
		if !exists {
			return false
		}
		if condition.Operator == "equals" && val != condition.Value {
			return false
		}
	}

	return true
}

// matchFrontendTrigger maps frontend trigger IDs to backend events
func (s *AutomationService) matchFrontendTrigger(triggerID, eventType string, context map[string]interface{}, config models.JSONMap) bool {
	// Map frontend trigger IDs to expected backend events
	triggerEventMap := map[string][]string{
		"card_added_to_board": {"card.created", "card.moved"},
		"card_added_to_list":  {"card.created", "card.moved"},
		"card_archived":       {"card.archived", "card.unarchived"},
		"card_status_changed": {"card.completed", "card.incomplete"},
		"label_changed":       {"card.label_added", "card.label_removed"},
		"member_changed":      {"card.member_added", "card.member_removed"},
		"member_me_changed":   {"card.member_added", "card.member_removed"},
		"date_changed":        {"card.due_date_changed"},
		"list_created":        {"list.created", "list.renamed", "list.archived"},
	}

	// Check if eventType matches any expected events for this trigger
	expectedEvents, ok := triggerEventMap[triggerID]
	if !ok {
		log.Printf("[Automation] Unknown trigger ID: %s", triggerID)
		return false
	}

	eventMatched := false
	for _, e := range expectedEvents {
		if e == eventType {
			eventMatched = true
			break
		}
	}
	if !eventMatched {
		return false
	}

	// Check conditions based on trigger type
	switch triggerID {
	case "card_added_to_list":
		// Check if card was created/moved to the specified list
		listID, _ := config["list_id"].(string)
		if listID != "" {
			contextListID, _ := context["list_id"].(string)
			if listID != contextListID {
				return false
			}
		}
		// Check verb (added to, moved into, etc.)
		verb, _ := config["verb"].(string)
		if verb == "moved into" && eventType != "card.moved" {
			return false
		}
		if verb == "created in" && eventType != "card.created" {
			return false
		}

	case "card_archived":
		verb, _ := config["verb"].(string)
		if verb == "archived" && eventType != "card.archived" {
			return false
		}
		if verb == "unarchived" && eventType != "card.unarchived" {
			return false
		}

	case "label_changed":
		verb, _ := config["verb"].(string)
		if verb == "added to" && eventType != "card.label_added" {
			return false
		}
		if verb == "removed from" && eventType != "card.label_removed" {
			return false
		}
		// Check label_id match
		labelID, _ := config["label_id"].(string)
		if labelID != "" {
			contextLabelID, _ := context["label_id"].(string)
			if labelID != contextLabelID {
				return false
			}
		}

	case "member_changed", "member_me_changed":
		verb, _ := config["verb"].(string)
		if verb == "added to" && eventType != "card.member_added" {
			return false
		}
		if verb == "removed from" && eventType != "card.member_removed" {
			return false
		}

	case "card_status_changed":
		status, _ := config["status"].(string)
		if status == "complete" && eventType != "card.completed" {
			return false
		}
		if status == "incomplete" && eventType != "card.incomplete" {
			return false
		}
	}

	log.Printf("[Automation] Rule matched: trigger=%s event=%s", triggerID, eventType)
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
		var err error
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

		switch actionType {
		case "move_card":
			var action models.MoveCardAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeMoveCard(action, context)
		case "add_label":
			var action models.AddLabelAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeAddLabel(action, context)
		case "remove_label":
			var action models.RemoveLabelAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeRemoveLabel(action, context)
		case "add_member":
			var action models.AssignMemberAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeAddMember(action, context)
		case "remove_member":
			var action models.RemoveMemberAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeRemoveMember(action, context)
		case "set_due_date":
			var action models.SetDueDateAction
			json.Unmarshal(actionBytes, &action)
			err = s.executeSetDueDate(action, context)
		case "archive_card":
			err = s.executeArchiveCard(context)
		case "unarchive_card":
			err = s.executeUnarchiveCard(context)
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

func (s *AutomationService) executeUnarchiveCard(context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	return s.cardRepo.Unarchive(cardID)
}

func (s *AutomationService) executeRemoveLabel(action models.RemoveLabelAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	labelID, _ := uuid.Parse(action.LabelID)

	return s.cardRepo.RemoveLabel(cardID, labelID)
}

func (s *AutomationService) executeAddMember(action models.AssignMemberAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	userID, _ := uuid.Parse(action.UserID)

	return s.cardRepo.AddMember(cardID, userID)
}

func (s *AutomationService) executeRemoveMember(action models.RemoveMemberAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)
	userID, _ := uuid.Parse(action.UserID)

	return s.cardRepo.RemoveMember(cardID, userID)
}

func (s *AutomationService) executeSetDueDate(action models.SetDueDateAction, context map[string]interface{}) error {
	cardIDStr, ok := context["card_id"].(string)
	if !ok {
		return errors.New("card_id missing in context")
	}
	cardID, _ := uuid.Parse(cardIDStr)

	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return errors.New("card not found")
	}

	// Parse due date - can be ISO date or relative like "+7d"
	dueDateStr := action.DueDate
	var dueDate time.Time

	if len(dueDateStr) > 0 && dueDateStr[0] == '+' {
		// Relative date parsing (e.g., "+7d", "+1w", "+2h")
		duration, err := parseRelativeDuration(dueDateStr[1:])
		if err != nil {
			return fmt.Errorf("invalid relative date format: %v", err)
		}
		dueDate = time.Now().Add(duration)
	} else {
		// ISO date parsing
		parsed, err := time.Parse(time.RFC3339, dueDateStr)
		if err != nil {
			// Try simple date format
			parsed, err = time.Parse("2006-01-02", dueDateStr)
			if err != nil {
				return fmt.Errorf("invalid date format: %v", err)
			}
		}
		dueDate = parsed
	}

	card.DueDate = &dueDate
	return s.cardRepo.Update(card)
}

// parseRelativeDuration parses strings like "7d", "1w", "2h" into time.Duration
func parseRelativeDuration(s string) (time.Duration, error) {
	if len(s) < 2 {
		return 0, errors.New("duration too short")
	}

	unit := s[len(s)-1]
	numStr := s[:len(s)-1]

	var num int
	_, err := fmt.Sscanf(numStr, "%d", &num)
	if err != nil {
		return 0, err
	}

	switch unit {
	case 'h':
		return time.Duration(num) * time.Hour, nil
	case 'd':
		return time.Duration(num) * 24 * time.Hour, nil
	case 'w':
		return time.Duration(num) * 7 * 24 * time.Hour, nil
	case 'm':
		return time.Duration(num) * 30 * 24 * time.Hour, nil // approximate month
	default:
		return 0, fmt.Errorf("unknown unit: %c", unit)
	}
}
