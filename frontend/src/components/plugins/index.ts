/**
 * Plugin Components
 * Export all plugin-related components
 */

export * from './PluginProvider';
export * from './CardBadgeRenderer';
export * from './CardBackSectionRenderer';
export { PluginModalHandler } from './PluginModalHandler';

// Re-export plugin loader for convenience
export { pluginLoader } from '@/lib/pluginLoader';
export type { LoadedPlugin, PluginContext } from '@/lib/pluginLoader';

// Re-export iframe utilities
export { createRenderIframe, type PluginSlotType } from '@/lib/pluginIframeManager';
