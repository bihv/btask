package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type AutomationRepository struct {
	db *gorm.DB
}

func NewAutomationRepository(db *gorm.DB) *AutomationRepository {
	return &AutomationRepository{db: db}
}

// Rule Operations
func (r *AutomationRepository) CreateRule(rule *models.AutomationRule) error {
	return r.db.Create(rule).Error
}

func (r *AutomationRepository) UpdateRule(rule *models.AutomationRule) error {
	return r.db.Save(rule).Error
}

func (r *AutomationRepository) DeleteRule(id uuid.UUID) error {
	return r.db.Delete(&models.AutomationRule{}, "id = ?", id).Error
}

func (r *AutomationRepository) FindRuleByID(id uuid.UUID) (*models.AutomationRule, error) {
	var rule models.AutomationRule
	err := r.db.Preload("Creator").First(&rule, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *AutomationRepository) FindRulesByBoard(boardID uuid.UUID) ([]models.AutomationRule, error) {
	var rules []models.AutomationRule
	err := r.db.Where("board_id = ?", boardID).Find(&rules).Error
	return rules, err
}

func (r *AutomationRepository) FindRulesByWorkspace(workspaceID uuid.UUID) ([]models.AutomationRule, error) {
	var rules []models.AutomationRule
	err := r.db.Where("workspace_id = ?", workspaceID).Find(&rules).Error
	return rules, err
}

// Find rules matching a trigger type (for Rule Engine)
func (r *AutomationRepository) FindActiveRulesByTrigger(triggerType string, boardID *uuid.UUID) ([]models.AutomationRule, error) {
	query := r.db.Where("is_enabled = ? AND trigger_type = ?", true, triggerType)

	if boardID != nil {
		query = query.Where("board_id = ? OR workspace_id = (SELECT workspace_id FROM boards WHERE id = ?)", *boardID, *boardID)
	}

	var rules []models.AutomationRule
	err := query.Find(&rules).Error
	return rules, err
}

// Run Operations
func (r *AutomationRepository) CreateRun(run *models.AutomationRun) error {
	return r.db.Create(run).Error
}

func (r *AutomationRepository) UpdateRun(run *models.AutomationRun) error {
	return r.db.Save(run).Error
}
