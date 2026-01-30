/**
 * Plugin Components
 * Export all plugin-related components
 */

export { PluginProvider, usePlugins, usePluginsOptional } from './PluginProvider';
export { PluginModalHandler } from './PluginModalHandler';
export { CardBadgeRenderer } from './CardBadgeRenderer';
export { CardBackSectionRenderer } from './CardBackSectionRenderer';
export { CardButtonRenderer } from './CardButtonRenderer';

// Re-export plugin loader for convenience
export { pluginLoader } from '@/lib/pluginLoader';
export type { LoadedPlugin, PluginContext } from '@/lib/pluginLoader';

// Re-export iframe utilities
export { createRenderIframe, type PluginSlotType } from '@/lib/pluginIframeManager';
