package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Plugin represents a registered plugin in the system
type Plugin struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	Slug             string     `json:"slug" gorm:"uniqueIndex;not null"`
	Name             string     `json:"name" gorm:"not null"`
	Description      string     `json:"description"`
	Version          string     `json:"version" gorm:"not null"`
	AuthorID         *uuid.UUID `json:"author_id" gorm:"type:uuid"`
	IconURL          string     `json:"icon_url"`
	HomepageURL      string     `json:"homepage_url"`
	PrivacyPolicyURL string     `json:"privacy_policy_url"`

	// Plugin source
	ManifestURL string `json:"manifest_url"`
	ClientURL   string `json:"client_url"`
	ServerURL   string `json:"server_url"`

	// Status
	Status     string `json:"status" gorm:"default:'draft'"` // draft, review, published, suspended
	IsOfficial bool   `json:"is_official" gorm:"default:false"`
	IsPublic   bool   `json:"is_public" gorm:"default:false"`

	// Marketplace
	InstallCount int     `json:"install_count" gorm:"default:0"`
	RatingAvg    float64 `json:"rating_avg" gorm:"type:decimal(3,2);default:0"`
	RatingCount  int     `json:"rating_count" gorm:"default:0"`

	// Pricing
	PricingType  string   `json:"pricing_type" gorm:"default:'free'"` // free, paid, freemium
	PriceMonthly *float64 `json:"price_monthly" gorm:"type:decimal(10,2)"`
	PriceYearly  *float64 `json:"price_yearly" gorm:"type:decimal(10,2)"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Author        *User                `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Capabilities  []PluginCapability   `json:"capabilities,omitempty" gorm:"foreignKey:PluginID"`
	Permissions   []PluginPermission   `json:"permissions,omitempty" gorm:"foreignKey:PluginID"`
	Installations []PluginInstallation `json:"installations,omitempty" gorm:"foreignKey:PluginID"`
}

func (p *Plugin) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// PluginCapability represents what a plugin can do
type PluginCapability struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	PluginID   uuid.UUID `json:"plugin_id" gorm:"type:uuid;not null;index"`
	Capability string    `json:"capability" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	Plugin Plugin `json:"-" gorm:"foreignKey:PluginID"`
}

func (pc *PluginCapability) BeforeCreate(tx *gorm.DB) error {
	if pc.ID == uuid.Nil {
		pc.ID = uuid.New()
	}
	return nil
}

// PluginPermission represents data access permissions
type PluginPermission struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	PluginID   uuid.UUID `json:"plugin_id" gorm:"type:uuid;not null;index"`
	Permission string    `json:"permission" gorm:"not null"`
	Scope      string    `json:"scope" gorm:"default:'board'"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	Plugin Plugin `json:"-" gorm:"foreignKey:PluginID"`
}

func (pp *PluginPermission) BeforeCreate(tx *gorm.DB) error {
	if pp.ID == uuid.Nil {
		pp.ID = uuid.New()
	}
	return nil
}

// PluginInstallation represents where a plugin is installed
type PluginInstallation struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	PluginID    uuid.UUID  `json:"plugin_id" gorm:"type:uuid;not null;index"`
	WorkspaceID *uuid.UUID `json:"workspace_id" gorm:"type:uuid;index"`
	BoardID     *uuid.UUID `json:"board_id" gorm:"type:uuid;index"`
	InstalledBy *uuid.UUID `json:"installed_by" gorm:"type:uuid"`
	IsEnabled   bool       `json:"is_enabled" gorm:"default:true"`
	Settings    JSONMap    `json:"settings" gorm:"type:jsonb;default:'{}'"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relations
	Plugin    Plugin         `json:"plugin,omitempty" gorm:"foreignKey:PluginID"`
	Workspace *Workspace     `json:"workspace,omitempty" gorm:"foreignKey:WorkspaceID"`
	Board     *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Installer *User          `json:"installer,omitempty" gorm:"foreignKey:InstalledBy"`
	APIKeys   []PluginAPIKey `json:"api_keys,omitempty" gorm:"foreignKey:InstallationID"`
}

func (pi *PluginInstallation) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

// PluginAPIKey represents authentication tokens for plugins
type PluginAPIKey struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	PluginID       uuid.UUID  `json:"plugin_id" gorm:"type:uuid;not null;index"`
	InstallationID uuid.UUID  `json:"installation_id" gorm:"type:uuid;not null;index"`
	APIKey         string     `json:"api_key" gorm:"uniqueIndex;not null"`
	APISecretHash  string     `json:"-" gorm:"not null"`
	UserID         *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	IsActive       bool       `json:"is_active" gorm:"default:true"`
	LastUsedAt     *time.Time `json:"last_used_at"`
	ExpiresAt      *time.Time `json:"expires_at"`
	CreatedAt      time.Time  `json:"created_at"`

	// Relations
	Plugin       Plugin             `json:"-" gorm:"foreignKey:PluginID"`
	Installation PluginInstallation `json:"-" gorm:"foreignKey:InstallationID"`
	User         *User              `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (pak *PluginAPIKey) BeforeCreate(tx *gorm.DB) error {
	if pak.ID == uuid.Nil {
		pak.ID = uuid.New()
	}
	return nil
}

// PluginData represents key-value storage for plugin data
type PluginData struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	PluginID       uuid.UUID `json:"plugin_id" gorm:"type:uuid;not null;index"`
	InstallationID uuid.UUID `json:"installation_id" gorm:"type:uuid;not null;index"`
	Scope          string    `json:"scope" gorm:"not null;index:idx_plugin_data_scope"` // board, card, list, workspace, user
	EntityID       uuid.UUID `json:"entity_id" gorm:"type:uuid;not null;index:idx_plugin_data_scope"`
	Key            string    `json:"key" gorm:"not null"`
	Value          JSONMap   `json:"value" gorm:"type:jsonb;not null"`
	Visibility     string    `json:"visibility" gorm:"default:'private'"` // private, shared
	IsEncrypted    bool      `json:"is_encrypted" gorm:"default:false"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Plugin       Plugin             `json:"-" gorm:"foreignKey:PluginID"`
	Installation PluginInstallation `json:"-" gorm:"foreignKey:InstallationID"`
}

func (pd *PluginData) BeforeCreate(tx *gorm.DB) error {
	if pd.ID == uuid.Nil {
		pd.ID = uuid.New()
	}
	return nil
}

// PluginSecret represents encrypted secrets for plugins
type PluginSecret struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	PluginID        uuid.UUID  `json:"plugin_id" gorm:"type:uuid;not null;index"`
	InstallationID  uuid.UUID  `json:"installation_id" gorm:"type:uuid;not null;index"`
	UserID          *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Key             string     `json:"key" gorm:"not null"`
	EncryptedValue  []byte     `json:"-" gorm:"not null"`
	EncryptionKeyID string     `json:"-" gorm:"not null"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relations
	Plugin       Plugin             `json:"-" gorm:"foreignKey:PluginID"`
	Installation PluginInstallation `json:"-" gorm:"foreignKey:InstallationID"`
	User         *User              `json:"-" gorm:"foreignKey:UserID"`
}

func (ps *PluginSecret) BeforeCreate(tx *gorm.DB) error {
	if ps.ID == uuid.Nil {
		ps.ID = uuid.New()
	}
	return nil
}

// PluginDataRetention tracks data for cleanup after uninstall
type PluginDataRetention struct {
	ID                  uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	InstallationID      uuid.UUID `json:"installation_id" gorm:"type:uuid;not null"`
	UninstalledAt       time.Time `json:"uninstalled_at" gorm:"not null"`
	ScheduledDeletionAt time.Time `json:"scheduled_deletion_at" gorm:"not null;index"`
	IsDeleted           bool      `json:"is_deleted" gorm:"default:false;index"`
	CreatedAt           time.Time `json:"created_at"`

	// Relations
	Installation PluginInstallation `json:"-" gorm:"foreignKey:InstallationID"`
}

func (pdr *PluginDataRetention) BeforeCreate(tx *gorm.DB) error {
	if pdr.ID == uuid.Nil {
		pdr.ID = uuid.New()
	}
	return nil
}

// Request/Response DTOs
type CreatePluginRequest struct {
	Slug             string   `json:"slug" validate:"required,min=3,max=100,alphanum"`
	Name             string   `json:"name" validate:"required,min=3,max=200"`
	Description      string   `json:"description" validate:"max=1000"`
	Version          string   `json:"version" validate:"required"`
	IconURL          string   `json:"icon_url" validate:"omitempty,url"`
	HomepageURL      string   `json:"homepage_url" validate:"omitempty,url"`
	PrivacyPolicyURL string   `json:"privacy_policy_url" validate:"omitempty,url"`
	ManifestURL      string   `json:"manifest_url" validate:"required,url"`
	ClientURL        string   `json:"client_url" validate:"required,url"`
	ServerURL        string   `json:"server_url" validate:"omitempty,url"`
	Capabilities     []string `json:"capabilities" validate:"required,min=1"`
	Permissions      []string `json:"permissions" validate:"required,min=1"`
	PricingType      string   `json:"pricing_type" validate:"omitempty,oneof=free paid freemium"`
	PriceMonthly     *float64 `json:"price_monthly"`
	PriceYearly      *float64 `json:"price_yearly"`
}

type UpdatePluginRequest struct {
	Name             string   `json:"name" validate:"omitempty,min=3,max=200"`
	Description      string   `json:"description" validate:"max=1000"`
	Version          string   `json:"version"`
	IconURL          string   `json:"icon_url" validate:"omitempty,url"`
	HomepageURL      string   `json:"homepage_url" validate:"omitempty,url"`
	PrivacyPolicyURL string   `json:"privacy_policy_url" validate:"omitempty,url"`
	ManifestURL      string   `json:"manifest_url" validate:"omitempty,url"`
	ClientURL        string   `json:"client_url" validate:"omitempty,url"`
	ServerURL        string   `json:"server_url" validate:"omitempty,url"`
	Status           string   `json:"status" validate:"omitempty,oneof=draft review published suspended"`
	IsPublic         *bool    `json:"is_public"`
	Capabilities     []string `json:"capabilities"`
	Permissions      []string `json:"permissions"`
	PricingType      string   `json:"pricing_type" validate:"omitempty,oneof=free paid freemium"`
	PriceMonthly     *float64 `json:"price_monthly"`
	PriceYearly      *float64 `json:"price_yearly"`
}

type InstallPluginRequest struct {
	WorkspaceID *string                `json:"workspace_id"`
	BoardID     *string                `json:"board_id"`
	Settings    map[string]interface{} `json:"settings"`
}

type UpdatePluginSettingsRequest struct {
	Settings map[string]interface{} `json:"settings" validate:"required"`
}
