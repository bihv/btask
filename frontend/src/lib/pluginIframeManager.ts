/**
 * Plugin Iframe Manager
 * Handles creation and management of plugin sandboxed iframes
 * 
 * Supports two types of iframes:
 * 1. Hidden iframes - for background logic (event handlers, etc.)
 * 2. Visible iframes - for rendering plugin UI directly
 */

import type { PluginInstallation } from '@/types';
import {
  buildBackgroundCSP,
  buildBackgroundHtml,
  buildBackgroundRuntimeScript,
  buildRenderCSP,
  buildRenderHtml,
  buildRenderRuntimeScript,
} from './pluginIframeTemplates';
import type { PluginContext } from './pluginLoader';

// Configuration constants
export const PLUGIN_TIMEOUT = 30000; // 30 seconds
export const MESSAGE_TIMEOUT = 5000; // 5 seconds

// Allowed origins for plugin communication (configure based on environment)
export const ALLOWED_ORIGINS = [
  typeof window !== 'undefined' ? window.location.origin : '', // Same origin
];

import { PLUGIN_SLOTS } from '@/constants/plugin';

// Slot types that plugins can render into
export type PluginSlotType = typeof PLUGIN_SLOTS[keyof typeof PLUGIN_SLOTS];

/**
 * Creates a hidden sandboxed iframe for plugin background logic
 */
export function createPluginIframe(
  installation: PluginInstallation,
  context: PluginContext
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  // Security: sandbox the iframe with minimal permissions
  iframe.sandbox.add('allow-scripts'); // Required for plugin code
  iframe.sandbox.add('allow-same-origin'); // Needed for postMessage (be cautious)

  // Hide iframe (background logic only)
  iframe.style.display = 'none';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  // Set data attributes for identification
  iframe.dataset.pluginId = installation.plugin_id;
  iframe.dataset.installationId = installation.id;
  iframe.dataset.type = 'background';

  // Build plugin URL with context
  const pluginUrl = new URL(installation.plugin.client_url);
  pluginUrl.searchParams.set('installationId', installation.id);

  // Extract origins for CSP
  const pluginOrigin = pluginUrl.origin;
  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '*';

  // Build HTML content using templates
  const cspPolicy = buildBackgroundCSP(pluginOrigin, hostOrigin);
  const runtimeScript = buildBackgroundRuntimeScript(installation.id);
  const htmlContent = buildBackgroundHtml({
    cspPolicy,
    pluginName: installation.plugin.name,
    runtimeScript,
    pluginUrl: pluginUrl.toString(),
  });

  iframe.srcdoc = htmlContent;

  // Append to body
  document.body.appendChild(iframe);

  return iframe;
}

/**
 * Creates a visible iframe for plugin UI rendering
 */
export function createRenderIframe(
  installation: PluginInstallation,
  slotType: PluginSlotType,
  context: any
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  // Security: sandbox with limited permissions
  iframe.sandbox.add('allow-scripts');
  iframe.sandbox.add('allow-same-origin');

  // Visible iframe styling
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.height = '0'; // Will be resized by plugin
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';

  // Set data attributes
  iframe.dataset.pluginId = installation.plugin_id;
  iframe.dataset.installationId = installation.id;
  iframe.dataset.slotType = slotType;
  iframe.dataset.type = 'render';

  // Build plugin URL
  const pluginUrl = new URL(installation.plugin.client_url);
  pluginUrl.searchParams.set('installationId', installation.id);
  pluginUrl.searchParams.set('slot', slotType);

  // Extract origins for CSP
  const pluginOrigin = pluginUrl.origin;
  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '*';

  // Build HTML content using templates
  const cspPolicy = buildRenderCSP(pluginOrigin, hostOrigin);
  const runtimeScript = buildRenderRuntimeScript(installation.id, slotType, context);
  const htmlContent = buildRenderHtml({
    cspPolicy,
    runtimeScript,
    pluginUrl: pluginUrl.toString(),
  });

  iframe.srcdoc = htmlContent;

  return iframe;
}

/**
 * Handle resize message from render iframe
 */
export function handleRenderResize(
  event: MessageEvent,
  iframeMap: Map<string, HTMLIFrameElement>
): void {
  const { installationId, slotType, height } = event.data;

  // Find the iframe
  const key = `${installationId}:${slotType}`;
  const iframe = iframeMap.get(key);

  if (iframe) {
    if (height > 0) iframe.style.height = `${height}px`;
    if (event.data.width > 0) iframe.style.width = `${event.data.width}px`;
  }
}
