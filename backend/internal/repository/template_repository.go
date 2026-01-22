package repository

import (
	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"gorm.io/gorm"
)

type TemplateRepository struct {
	db *gorm.DB
}

func NewTemplateRepository(db *gorm.DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

func (r *TemplateRepository) Create(template *models.Template) error {
	return r.db.Create(template).Error
}

func (r *TemplateRepository) FindByID(id uuid.UUID) (*models.Template, error) {
	var template models.Template
	err := r.db.Preload("Lists", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).Preload("Lists.Cards", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).Preload("Creator").First(&template, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *TemplateRepository) FindAll(params models.TemplateListParams, includeInactive bool) ([]models.Template, int64, error) {
	var templates []models.Template
	var total int64

	query := r.db.Model(&models.Template{})

	// Filter by active status (public API only shows active)
	if !includeInactive {
		query = query.Where("is_active = ?", true)
	}

	// Search filter
	if params.Search != "" {
		search := "%" + params.Search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ? OR category ILIKE ?", search, search, search)
	}

	// Category filter
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// Featured filter
	if params.IsFeatured != nil {
		query = query.Where("is_featured = ?", *params.IsFeatured)
	}

	// Count total
	query.Count(&total)

	// Pagination
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	err := query.
		Preload("Lists", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Preload("Lists.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Order("is_featured DESC, created_at DESC").
		Offset(offset).
		Limit(params.Limit).
		Find(&templates).Error

	return templates, total, err
}

func (r *TemplateRepository) Update(template *models.Template) error {
	return r.db.Save(template).Error
}

func (r *TemplateRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Template{}, "id = ?", id).Error
}

func (r *TemplateRepository) IncrementViews(id uuid.UUID) error {
	return r.db.Model(&models.Template{}).Where("id = ?", id).UpdateColumn("views", gorm.Expr("views + 1")).Error
}

func (r *TemplateRepository) IncrementCopies(id uuid.UUID) error {
	return r.db.Model(&models.Template{}).Where("id = ?", id).UpdateColumn("copies", gorm.Expr("copies + 1")).Error
}

// Lists
func (r *TemplateRepository) CreateList(list *models.TemplateList) error {
	return r.db.Create(list).Error
}

func (r *TemplateRepository) DeleteListsByTemplateID(templateID uuid.UUID) error {
	// First, get all list IDs for this template
	var listIDs []uuid.UUID
	if err := r.db.Model(&models.TemplateList{}).
		Where("template_id = ?", templateID).
		Pluck("id", &listIDs).Error; err != nil {
		return err
	}

	// Delete all cards belonging to these lists
	if len(listIDs) > 0 {
		if err := r.db.Where("template_list_id IN ?", listIDs).
			Delete(&models.TemplateCard{}).Error; err != nil {
			return err
		}
	}

	// Now delete the lists
	return r.db.Where("template_id = ?", templateID).Delete(&models.TemplateList{}).Error
}

// Cards
func (r *TemplateRepository) CreateCard(card *models.TemplateCard) error {
	return r.db.Create(card).Error
}
