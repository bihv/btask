/**
 * Main Mello Plugin SDK Class
 */

import EventEmitter from 'eventemitter3';
import { MelloClient } from './client';
import {
  DataError,
  InitializationError,
  PermissionError,
  PluginError,
  PluginErrorCode,
} from './errors';
import type {
  AttachmentSection,
  BoardButton,
  CardBackSection,
  CardBadge,
  CardButton,
  DataScope,
  EventPayload,
  EventType,
  HookRegistration,
  ModalOptions,
  PluginCapability,
  PluginContext,
  PluginManifest,
  SnackbarType,
} from './types';

export class MelloPlugin extends EventEmitter {
  private client?: MelloClient;
  private manifest?: PluginManifest;
  private context?: PluginContext;
  private hooks: Map<string, HookRegistration> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the plugin with token
   */
  async initialize(token: string, apiUrl?: string): Promise<void> {
    this.client = new MelloClient({
      token,
      apiUrl,
      debug: process.env.NODE_ENV === 'development',
    });

    // Request context from parent window
    await this.requestContext();

    this.emit('initialized');
  }

  /**
   * Set plugin manifest
   */
  setManifest(manifest: PluginManifest): void {
    this.manifest = manifest;
  }

  /**
   * Get current context
   */
  getContext(): PluginContext | undefined {
    return this.context;
  }

  /**
   * Request context from parent window via postMessage
   */
  private async requestContext(): Promise<void> {
    return new Promise((resolve) => {
      // Send request to parent
      window.parent.postMessage(
        { type: 'mello:context:request' },
        '*'
      );

      // Listen for response
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'mello:context:response') {
          this.context = event.data.context;
          if (this.context && this.client) {
            this.client.setContext(this.context);
          }
          window.removeEventListener('message', handleMessage);
          resolve();
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  // ===== Data Storage API =====

  async getData<T = any>(
    scope: DataScope,
    entityId: string,
    key: string
  ): Promise<T | null> {
    if (!this.client) {
      throw new InitializationError('Plugin not initialized');
    }
    try {
      return await this.client.getData<T>(scope, entityId, key);
    } catch (error) {
      throw new DataError('LOAD', `Failed to load data: ${scope}/${entityId}/${key}`, error);
    }
  }

  async setData<T = any>(
    scope: DataScope,
    entityId: string,
    key: string,
    value: T
  ): Promise<void> {
    if (!this.client) {
      throw new InitializationError('Plugin not initialized');
    }
    try {
      const success = await this.client.setData(scope, entityId, key, value);
      if (!success) {
        throw new DataError('SAVE', 'Failed to save data');
      }
    } catch (error) {
      if (error instanceof DataError) throw error;
      throw new DataError('SAVE', `Failed to save data: ${scope}/${entityId}/${key}`, error);
    }
  }

  async deleteData(
    scope: DataScope,
    entityId: string,
    key: string
  ): Promise<void> {
    if (!this.client) {
      throw new InitializationError('Plugin not initialized');
    }
    try {
      await this.client.deleteData(scope, entityId, key);
    } catch (error) {
      throw new DataError('DELETE', `Failed to delete data: ${scope}/${entityId}/${key}`, error);
    }
  }

  // ===== Mello API Access =====

  get api() {
    if (!this.client) {
      throw new InitializationError('Plugin not initialized');
    }
    return {
      getBoard: this.client.getBoard.bind(this.client),
      getCard: this.client.getCard.bind(this.client),
      getList: this.client.getList.bind(this.client),
      updateCard: this.client.updateCard.bind(this.client),
      addComment: this.client.addComment.bind(this.client),
      moveCard: this.client.moveCard.bind(this.client),
      archiveCard: this.client.archiveCard.bind(this.client),
      unarchiveCard: this.client.unarchiveCard.bind(this.client),
    };
  }

  // ===== Hook Registration =====

  registerCardBadge(badge: {
    id: string;
    getBadge: (card: any, context: PluginContext) => CardBadge | Promise<CardBadge> | null;
  }): void {
    this.registerHook('card-badges', badge.id, badge.getBadge);
  }

  registerCardButton(button: CardButton & { id: string }): void {
    this.registerHook('card-buttons', button.id, button);
  }

  registerCardBackSection(section: CardBackSection): void {
    this.registerHook('card-back-section', section.id, section);
  }

  registerBoardButton(button: BoardButton & { id: string }): void {
    this.registerHook('board-buttons', button.id, button);
  }

  registerAttachmentSection(section: AttachmentSection & { id: string }): void {
    this.registerHook('attachment-sections', section.id, section);
  }

  private registerHook(
    capability: PluginCapability,
    id: string,
    handler: any
  ): void {
    const hookId = `${capability}:${id}`;
    this.hooks.set(hookId, {
      id: hookId,
      capability,
      handler,
    });

    // Notify parent window about new hook
    window.parent.postMessage(
      {
        type: 'mello:hook:register',
        capability,
        id,
      },
      '*'
    );
  }

  // ===== UI Interactions =====

  showModal(options: ModalOptions): void {
    window.parent.postMessage(
      {
        type: 'mello:modal:show',
        options,
      },
      '*'
    );
  }

  closeModal(): void {
    window.parent.postMessage(
      {
        type: 'mello:modal:close',
      },
      '*'
    );
  }

  showSnackbar(message: string, type: SnackbarType = 'info'): void {
    window.parent.postMessage(
      {
        type: 'mello:snackbar:show',
        message,
        snackbarType: type,
      },
      '*'
    );
  }

  // ===== Event System =====

  onEvent(event: EventType, callback: (payload: EventPayload) => void): void {
    this.on(event, callback);
  }

  offEvent(event: EventType, callback: (payload: EventPayload) => void): void {
    this.off(event, callback);
  }

  // ===== Helpers =====

  hasPermission(permission: string): boolean {
    return this.client?.hasPermission(permission) || false;
  }

  requirePermission(permission: string): void {
    if (!this.hasPermission(permission)) {
      throw new PermissionError(permission);
    }
  }

  hasCapability(capability: PluginCapability): boolean {
    return this.manifest?.capabilities.includes(capability) || false;
  }

  requireCapability(capability: PluginCapability): void {
    if (!this.hasCapability(capability)) {
      throw new PluginError(
        PluginErrorCode.MISSING_CAPABILITY,
        `Plugin missing required capability: ${capability}`,
        { capability }
      );
    }
  }

  getSetting<T = any>(key: string): T | undefined {
    if (!this.context) return undefined;
    // Settings will be passed in context
    return (this.context as any).settings?.[key];
  }
}

// Export singleton instance
export const plugin = new MelloPlugin();
