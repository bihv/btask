/**
 * Core types for Mello Plugin SDK
 */

// Plugin Manifest
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };

  // Entry points
  client: string;
  server?: string;

  // Capabilities
  capabilities: PluginCapability[];

  // Permissions
  permissions: PluginPermission[];

  // Settings schema
  settings?: SettingsSchema;
}

// Plugin Capabilities
export type PluginCapability =
  | 'card-badges'
  | 'card-buttons'
  | 'card-back-section'
  | 'card-detail-badges'
  | 'board-buttons'
  | 'list-actions'
  | 'attachment-sections'
  | 'attachment-thumbnail'
  | 'show-settings'
  | 'on-enable'
  | 'on-disable'
  | 'authorization-status';

// Plugin Permissions
export type PluginPermission =
  | 'read:board'
  | 'write:board'
  | 'read:cards'
  | 'write:cards'
  | 'read:lists'
  | 'write:lists'
  | 'read:members'
  | 'read:workspace'
  | 'write:comments'
  | 'read:attachments'
  | 'write:attachments';

// Settings Schema
export interface SettingsSchema {
  [key: string]: SettingDefinition;
}

export interface SettingDefinition {
  type: 'boolean' | 'string' | 'number' | 'select';
  default?: any;
  label: string;
  description?: string;
  options?: Array<{ value: any; label: string }>;
}

// Plugin Context
export interface PluginContext {
  plugin: {
    id: string;
    installationId: string;
  };
  board?: {
    id: string;
    name: string;
  };
  card?: {
    id: string;
    name: string;
  };
  list?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  permissions: string[];
}

// Data Scopes
export type DataScope = 'board' | 'card' | 'list' | 'workspace' | 'user';

// Mello Core Types
export interface Board {
  id: string;
  title: string;
  description: string;
  background_color: string;
  background_image?: string;
  is_starred: boolean;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string;
  cover_image?: string;
  position: number;
  due_date?: string;
  is_completed: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  labels?: Label[];
  members?: User[];
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// UI Extension Types
export interface CardBadge {
  icon?: string;
  text?: string;
  color?: string;
  tooltip?: string;
  onClick?: () => void;
}

export interface CardButton {
  icon: string;
  text: string;
  onClick: () => void | Promise<void>;
  condition?: (card: Card) => boolean;
}

export interface CardBackSection {
  id: string;
  title: string;
  icon?: string;
  content: () => React.ReactNode | string;
  position?: 'before-description' | 'after-description' | 'after-activity';
}

export interface BoardButton {
  icon: string;
  text: string;
  onClick: () => void | Promise<void>;
}

export interface AttachmentSection {
  claimed: (attachment: Attachment) => boolean;
  render: (attachment: Attachment) => React.ReactNode;
  getThumbnail?: (attachment: Attachment) => string;
}

export interface Attachment {
  id: string;
  card_id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
}

// Modal Options
export interface ModalOptions {
  title: string;
  url?: string;
  content?: React.ReactNode;
  width?: number;
  height?: number;
  onClose?: () => void;
}

// Snackbar Types
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

// Event Types
export type EventType =
  | 'board.created'
  | 'board.updated'
  | 'board.deleted'
  | 'list.created'
  | 'list.updated'
  | 'list.moved'
  | 'list.archived'
  | 'card.created'
  | 'card.updated'
  | 'card.moved'
  | 'card.archived'
  | 'card.member.added'
  | 'card.member.removed'
  | 'card.label.added'
  | 'card.label.removed'
  | 'card.comment.added'
  | 'plugin.enabled'
  | 'plugin.disabled'
  | 'plugin.settings.updated';

// Event Payload
export interface EventPayload<T = any> {
  event: EventType;
  timestamp: string;
  actor: {
    type: 'user' | 'plugin' | 'automation';
    id: string;
    name?: string;
  };
  data: T;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

// API Response Types
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Hook Registration
export interface HookRegistration {
  id: string;
  capability: PluginCapability;
  handler: Function;
}
