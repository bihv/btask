/**
 * Plugin Message Handler
 * Handles postMessage communication between host and plugins
 */

import api from '@/lib/api';
import type { LoadedPlugin } from './pluginLoader';

interface MessageHandlerContext {
    loadedPlugins: Map<string, LoadedPlugin>;
    renderFrames: Map<Window, string>;
    isTrustedOrigin: (origin: string) => boolean;
    verifyMessageSource: (event: MessageEvent, expectedInstallationId?: string) => boolean;
}

/**
 * Handle context request from plugin
 */
export function handleContextRequest(
    event: MessageEvent,
    ctx: MessageHandlerContext
): void {
    // Verify source
    if (!ctx.verifyMessageSource(event)) {
        return;
    }

    // Find which plugin sent this request
    const iframe = Array.from(ctx.loadedPlugins.values()).find(
        (p) => p.iframe?.contentWindow === event.source
    );

    if (iframe && event.source) {
        // Send to specific origin instead of '*'
        const targetOrigin = event.origin === 'null' ? '*' : event.origin;
        (event.source as Window).postMessage(
            {
                type: 'mello:context:response',
                context: iframe.context,
            },
            targetOrigin
        );
    }
}

/**
 * Handle modal show request
 */
export function handleModalShow(event: MessageEvent): void {
    window.dispatchEvent(
        new CustomEvent('plugin:modal:show', {
            detail: event.data.options,
        })
    );
}

/**
 * Handle modal close request
 */
export function handleModalClose(): void {
    window.dispatchEvent(new CustomEvent('plugin:modal:close'));
}

/**
 * Handle snackbar show request
 */
export function handleSnackbarShow(event: MessageEvent): void {
    const { message, snackbarType } = event.data;
    window.dispatchEvent(
        new CustomEvent('plugin:snackbar:show', {
            detail: { message, type: snackbarType },
        })
    );
}

/**
 * Handle token request from plugin
 */
export function handleTokenRequest(
    event: MessageEvent,
    ctx: MessageHandlerContext,
    getPluginToken: (installationId: string) => string
): void {
    // Verify source
    if (!ctx.verifyMessageSource(event)) {
        return;
    }

    const plugin = Array.from(ctx.loadedPlugins.values()).find(
        (p) => p.iframe?.contentWindow === event.source
    );

    if (plugin && event.source) {
        const token = getPluginToken(plugin.installation.id);

        const targetOrigin = event.origin === 'null' ? '*' : event.origin;
        (event.source as Window).postMessage(
            {
                type: 'mello:token:response',
                token,
            },
            targetOrigin
        );
    }
}

/**
 * Handle data request from plugin
 */
export async function handleDataRequest(
    event: MessageEvent,
    ctx: MessageHandlerContext
): Promise<void> {
    const { messageId, scope, entityId, key } = event.data;

    // Verify source
    if (!ctx.verifyMessageSource(event)) {
        return;
    }

    let installationId: string | undefined;
    let plugin: LoadedPlugin | undefined;

    // Check if source is a render frame
    if (event.source && ctx.renderFrames.has(event.source as Window)) {
        installationId = ctx.renderFrames.get(event.source as Window);
        if (installationId) {
            plugin = ctx.loadedPlugins.get(installationId);
        }
    } else {
        // Fallback to finding by background iframe
        plugin = Array.from(ctx.loadedPlugins.values()).find(
            (p) => p.iframe?.contentWindow === event.source
        );
    }

    if (!plugin) return;

    try {
        const inst = plugin.installation as any;
        const pluginId = inst.plugin_id || inst.pluginId || inst.PluginID || inst.ID;

        if (!pluginId) {
            console.error('[PluginLoader] Missing plugin_id in installation:', inst);
            throw new Error('Missing plugin ID');
        }

        console.log('[PluginLoader] Fetching data:', { pluginId, instId: plugin.installation.id, scope, entityId, key });
        const response = await api.get(`/plugin-proxy/${pluginId}/${plugin.installation.id}/data/${scope}/${entityId}/${key}`);

        (event.source as Window).postMessage({
            type: 'mello:data:response',
            messageId,
            value: response.data
        }, '*');
    } catch (err: any) {
        console.error('[PluginLoader] Failed to fetch data:', err.response?.data || err.message);
        (event.source as Window).postMessage({
            type: 'mello:data:response',
            messageId,
            error: err.response?.data?.error || err.message
        }, '*');
    }
}

/**
 * Handle data save from plugin
 */
export async function handleDataSave(
    event: MessageEvent,
    ctx: MessageHandlerContext
): Promise<void> {
    const { messageId, scope, entityId, key, value } = event.data;

    // Verify source
    if (!ctx.verifyMessageSource(event)) {
        return;
    }

    let installationId: string | undefined;
    let plugin: LoadedPlugin | undefined;

    // Check if source is a render frame
    if (event.source && ctx.renderFrames.has(event.source as Window)) {
        installationId = ctx.renderFrames.get(event.source as Window);
        if (installationId) {
            plugin = ctx.loadedPlugins.get(installationId);
        }
    } else {
        // Fallback to finding by background iframe
        plugin = Array.from(ctx.loadedPlugins.values()).find(
            (p) => p.iframe?.contentWindow === event.source
        );
    }

    if (!plugin) return;

    try {
        const inst = plugin.installation as any;
        const pluginId = inst.plugin_id || inst.pluginId || inst.PluginID || inst.ID;

        if (!pluginId) {
            console.error('[PluginLoader] Missing plugin_id in installation:', inst);
            throw new Error('Missing plugin ID');
        }

        console.log('[PluginLoader] Saving data:', { pluginId, instId: plugin.installation.id, scope, entityId, key, value });
        await api.put(`/plugin-proxy/${pluginId}/${plugin.installation.id}/data/${scope}/${entityId}/${key}`, value);

        (event.source as Window).postMessage({
            type: 'mello:data:response',
            messageId,
            success: true
        }, '*');
    } catch (err: any) {
        console.error('[PluginLoader] Failed to save data:', err.response?.data || err.message);
        (event.source as Window).postMessage({
            type: 'mello:data:response',
            messageId,
            error: err.response?.data?.error || err.message
        }, '*');
    }
}

/**
 * Handle data updated notification from plugin
 */
export function handleDataUpdated(event: MessageEvent): void {
    const { scope, entityId, key } = event.data;
    console.log('[PluginLoader] Data updated:', { scope, entityId, key });

    // Broadcast to all plugins (including render frames)
    import('./pluginLoader').then(({ pluginLoader }) => {
        pluginLoader.broadcast('mello:data:updated', { scope, entityId, key });
    });

    // Dispatch custom event for React components to listen
    window.dispatchEvent(
        new CustomEvent('plugin:data:updated', {
            detail: { scope, entityId, key }
        })
    );
}

/**
 * Handle settings get request from plugin
 */
export function handleSettingsGet(
    event: MessageEvent,
    ctx: MessageHandlerContext
): void {
    const { messageId } = event.data;

    // Verify source
    if (!ctx.verifyMessageSource(event)) {
        return;
    }

    let plugin: LoadedPlugin | undefined;

    // Check if source is a render frame
    if (event.source && ctx.renderFrames.has(event.source as Window)) {
        const installationId = ctx.renderFrames.get(event.source as Window);
        if (installationId) {
            plugin = ctx.loadedPlugins.get(installationId);
        }
    } else {
        // Fallback to finding by background iframe
        plugin = Array.from(ctx.loadedPlugins.values()).find(
            (p) => p.iframe?.contentWindow === event.source
        );
    }

    if (plugin && event.source) {
        // Use settings from context or installation directly
        // Prefer context.settings which might be more up-to-date or contextual
        const settings = pluginContextOrInstallationSettings(plugin);

        const targetOrigin = event.origin === 'null' ? '*' : event.origin;
        (event.source as Window).postMessage({
            type: 'mello:data:response',
            messageId,
            value: settings
        }, targetOrigin);
    }
}

function pluginContextOrInstallationSettings(plugin: LoadedPlugin): Record<string, any> {
    return plugin.context.settings || plugin.installation.settings || {};
}
