/**
 * Plugin Loader
 * Loads and manages plugin iframes
 * 
 * Simplified for iframe-based rendering:
 * - Background iframes for event handling
 * - Render iframes created on-demand by components
 */

import type { PluginInstallation } from '@/types';
import { ALLOWED_ORIGINS, createPluginIframe, PLUGIN_TIMEOUT } from './pluginIframeManager';
import {
  handleContextRequest,
  handleDataRequest,
  handleDataSave,
  handleDataUpdated,
  handleModalClose,
  handleModalShow,
  handleSettingsGet,
  handleSnackbarShow,
  handleTokenRequest,
} from './pluginMessageHandler';

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
  user: {
    id: string;
    name: string;
    email: string;
  };
  permissions: string[];
  settings?: Record<string, any>;
}

export interface LoadedPlugin {
  installation: PluginInstallation;
  iframe: HTMLIFrameElement | null;
  context: PluginContext;
  ready: boolean;
}

class PluginLoader {
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private renderFrames: Map<Window, string> = new Map(); // Map render frame window to installationId
  private trustedOrigins: Set<string> = new Set(ALLOWED_ORIGINS);

  constructor() {
    // Listen for postMessage from plugins
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  /**
   * Add a trusted origin for plugin communication
   */
  addTrustedOrigin(origin: string): void {
    this.trustedOrigins.add(origin);
  }

  /**
   * Register a render iframe to allow it to communicate with the host
   */
  registerRenderFrame(iframe: HTMLIFrameElement, installationId: string) {
    if (iframe.contentWindow) {
      this.renderFrames.set(iframe.contentWindow, installationId);
    }
  }

  /**
   * Unregister a render iframe
   */
  unregisterRenderFrame(iframe: HTMLIFrameElement) {
    if (iframe.contentWindow) {
      this.renderFrames.delete(iframe.contentWindow);
    }
  }

  /**
   * Check if origin is trusted
   */
  private isTrustedOrigin(origin: string): boolean {
    // Allow blob: and data: URLs for srcdoc iframes
    if (origin === 'null' || origin.startsWith('blob:') || origin.startsWith('data:')) {
      return true;
    }
    return this.trustedOrigins.has(origin);
  }

  /**
   * Verify message origin and source
   */
  private verifyMessageSource(event: MessageEvent, expectedInstallationId?: string): boolean {
    // Check if origin is trusted
    if (!this.isTrustedOrigin(event.origin)) {
      console.warn('[PluginLoader] Message from untrusted origin:', event.origin);
      return false;
    }

    // If source is a render frame, verify installation ID matches
    if (event.source && this.renderFrames.has(event.source as Window)) {
      const mappedId = this.renderFrames.get(event.source as Window);
      if (expectedInstallationId && mappedId !== expectedInstallationId) {
        console.warn('[PluginLoader] Message source mismatch for render frame:', expectedInstallationId);
        return false;
      }
      return true;
    }

    // If installation ID is provided, verify the message is from that plugin (background frame)
    if (expectedInstallationId) {
      const plugin = this.loadedPlugins.get(expectedInstallationId);
      if (!plugin || plugin.iframe?.contentWindow !== event.source) {
        console.warn('[PluginLoader] Message source mismatch for installation:', expectedInstallationId);
        return false;
      }
    }

    return true;
  }

  /**
   * Get message handler context for external handlers
   */
  private getHandlerContext() {
    return {
      loadedPlugins: this.loadedPlugins,
      renderFrames: this.renderFrames,
      isTrustedOrigin: this.isTrustedOrigin.bind(this),
      verifyMessageSource: this.verifyMessageSource.bind(this),
    };
  }

  /**
   * Load a plugin for a board (background iframe)
   */
  async loadPlugin(
    installation: PluginInstallation,
    context: PluginContext
  ): Promise<LoadedPlugin> {
    const key = installation.id;

    // Check if already loaded
    if (this.loadedPlugins.has(key)) {
      const existing = this.loadedPlugins.get(key)!;
      existing.installation = installation;
      existing.context = context;
      return existing;
    }

    // Create loaded plugin entry
    const loadedPlugin: LoadedPlugin = {
      installation,
      iframe: null,
      context,
      ready: false,
    };

    this.loadedPlugins.set(key, loadedPlugin);

    // Create iframe for plugin using extracted function
    const iframe = createPluginIframe(installation, context);
    loadedPlugin.iframe = iframe;

    // Wait for plugin to be ready
    await this.waitForPluginReady(key);

    return loadedPlugin;
  }

  /**
   * Wait for plugin to signal it's ready
   */
  private waitForPluginReady(installationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        // Verify origin
        if (!this.verifyMessageSource(event, installationId)) {
          return;
        }

        if (
          event.data?.type === 'mello:plugin:ready' &&
          event.data?.installationId === installationId
        ) {
          console.log("[PluginLoader] Received ready signal from", installationId);
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          const plugin = this.loadedPlugins.get(installationId);
          if (plugin) {
            plugin.ready = true;
          }
          resolve();
        }
      };

      window.addEventListener('message', handler);

      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('Plugin initialization timeout'));
      }, PLUGIN_TIMEOUT);
    });
  }

  /**
   * Handle postMessage from plugins
   */
  private handleMessage(event: MessageEvent) {
    // Verify origin first
    if (!this.isTrustedOrigin(event.origin)) {
      console.warn('[PluginLoader] Blocked message from untrusted origin:', event.origin);
      return;
    }

    const { type } = event.data;

    // Skip non-mello messages
    if (!type || !type.startsWith('mello:')) {
      return;
    }

    const ctx = this.getHandlerContext();

    // Route messages to handlers
    switch (type) {
      case 'mello:context:request':
        handleContextRequest(event, ctx);
        break;
      case 'mello:modal:show':
        handleModalShow(event);
        break;
      case 'mello:modal:close':
        handleModalClose();
        break;
      case 'mello:snackbar:show':
        handleSnackbarShow(event);
        break;
      case 'mello:token:request':
        handleTokenRequest(event, ctx, this.getPluginToken.bind(this));
        break;
      case 'mello:data:request':
        handleDataRequest(event, ctx);
        break;
      case 'mello:data:save':
        handleDataSave(event, ctx);
        break;
      case 'mello:data:updated':
        handleDataUpdated(event);
        break;
      case 'mello:settings:get':
        handleSettingsGet(event, ctx);
        break;
      // Resize is handled by the component that creates the render iframe
      case 'mello:render:resize':
        // Dispatch as custom event for components to handle
        window.dispatchEvent(new CustomEvent('plugin:render:resize', {
          detail: event.data
        }));
        break;
    }
  }

  /**
   * Get plugin token for installation
   */
  private getPluginToken(installationId: string): string {
    return localStorage.getItem(`plugin_token_${installationId}`) || '';
  }

  /**
   * Broadcast event to all ready plugins
   */
  public broadcast(type: string, data: any) {
    // Broadcast to background iframes
    this.loadedPlugins.forEach((plugin) => {
      if (plugin.ready && plugin.iframe?.contentWindow) {
        // console.log('[PluginLoader] Broadcasting', type, 'to plugin', plugin.installation.id);
        plugin.iframe.contentWindow.postMessage({
          type,
          data
        }, '*');
      }
    });

    // Broadcast to render frames
    this.renderFrames.forEach((installationId, window) => {
      // console.log('[PluginLoader] Broadcasting', type, 'to render frame', installationId);
      window.postMessage({
        type,
        data
      }, '*');
    });
  }

  /**
   * Get all loaded plugins for a board
   */
  getPluginsForBoard(boardId: string): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values()).filter(
      (p) => p.context.board?.id === boardId && p.ready
    );
  }

  /**
   * Get a loaded plugin by installation ID
   */
  getPlugin(installationId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(installationId);
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(installationId: string) {
    const plugin = this.loadedPlugins.get(installationId);
    if (plugin?.iframe) {
      plugin.iframe.remove();
    }
    this.loadedPlugins.delete(installationId);
  }

  /**
   * Unload all plugins
   */
  unloadAll() {
    for (const [id] of this.loadedPlugins) {
      this.unloadPlugin(id);
    }
  }
}

// Singleton instance
export const pluginLoader = new PluginLoader();
