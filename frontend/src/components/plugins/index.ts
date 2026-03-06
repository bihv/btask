/**
 * Plugin Components
 * Export all plugin-related components
 */

export { CardBackSectionRenderer } from './CardBackSectionRenderer';
export { CardBadgeRenderer } from './CardBadgeRenderer';
export { CardButtonRenderer } from './CardButtonRenderer';
export { PluginModalHandler } from './PluginModalHandler';
export { PluginProvider, usePlugins, usePluginsOptional } from './PluginProvider';

// Re-export plugin loader for convenience
export { pluginLoader } from '@/lib/pluginLoader';
export type { LoadedPlugin, PluginContext } from '@/lib/pluginLoader';

// Re-export iframe utilities
export { createRenderIframe, type PluginSlotType } from '@/lib/pluginIframeManager';
