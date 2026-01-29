/**
 * @mello/plugin-sdk
 * Official SDK for building Mello plugins
 */

export { MelloPlugin, plugin } from './plugin';
export { MelloClient } from './client';

export type {
  // Core Types
  PluginManifest,
  PluginCapability,
  PluginPermission,
  PluginContext,
  DataScope,
  SettingsSchema,
  SettingDefinition,
  
  // Mello Types
  Board,
  List,
  Card,
  Label,
  User,
  Comment,
  Attachment,
  
  // UI Types
  CardBadge,
  CardButton,
  CardBackSection,
  BoardButton,
  AttachmentSection,
  ModalOptions,
  SnackbarType,
  
  // Event Types
  EventType,
  EventPayload,
  
  // API Types
  APIResponse,
  HookRegistration,
} from './types';
