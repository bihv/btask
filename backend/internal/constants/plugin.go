package constants

// Plugin permissions
const (
	PermissionReadBoards     = "read:boards"
	PermissionWriteBoards    = "write:boards"
	PermissionReadCards      = "read:cards"
	PermissionWriteCards     = "write:cards"
	PermissionReadLists      = "read:lists"
	PermissionWriteLists     = "write:lists"
	PermissionReadWorkspaces = "read:workspaces"
	PermissionWriteWorkspaces = "write:workspaces"
	PermissionReadUsers      = "read:users"
	PermissionAll            = "*"
)

// Plugin capabilities
const (
	CapabilityCardBadges      = "card-badges"
	CapabilityCardButtons     = "card-buttons"
	CapabilityCardBackSection = "card-back-section"
	CapabilityBoardButtons    = "board-buttons"
	CapabilityAttachmentSection = "attachment-sections"
	CapabilityBoardHeader     = "board-header"
	CapabilityWebhooks        = "webhooks"
)

// Plugin status
const (
	PluginStatusDraft     = "draft"
	PluginStatusReview    = "review"
	PluginStatusPublished = "published"
	PluginStatusSuspended = "suspended"
)

// Plugin pricing types
const (
	PricingTypeFree     = "free"
	PricingTypePaid     = "paid"
	PricingTypeFreemium = "freemium"
)

// Data scopes
const (
	ScopeBoard     = "board"
	ScopeCard      = "card"
	ScopeList      = "list"
	ScopeWorkspace = "workspace"
	ScopeUser      = "user"
)

// Rate limits
const (
	MaxRequestsPerMinute = 60
	MaxDataSizePerPlugin = 10 * 1024 * 1024 // 10MB
)

// Retention periods
const (
	DefaultDataRetentionDays = 90
	MinDataRetentionDays     = 7
	MaxDataRetentionDays     = 365
)

// Validation limits
const (
	MaxPluginNameLength        = 200
	MaxPluginDescriptionLength = 1000
	MaxPluginSlugLength        = 100
	MinPluginSlugLength        = 3
)

// Valid scopes for validation
var ValidScopes = map[string]bool{
	ScopeBoard:     true,
	ScopeCard:      true,
	ScopeList:      true,
	ScopeWorkspace: true,
	ScopeUser:      true,
}

// Valid plugin statuses
var ValidPluginStatuses = map[string]bool{
	PluginStatusDraft:     true,
	PluginStatusReview:    true,
	PluginStatusPublished: true,
	PluginStatusSuspended: true,
}

// Valid pricing types
var ValidPricingTypes = map[string]bool{
	PricingTypeFree:     true,
	PricingTypePaid:     true,
	PricingTypeFreemium: true,
}
