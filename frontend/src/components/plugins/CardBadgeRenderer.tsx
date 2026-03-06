/**
 * Card Badge Renderer
 * Renders plugin badges on card front using iframes
 * 
 * Each plugin renders its own UI inside a sandboxed iframe
 */

'use client';

import { PLUGIN_CAPABILITIES, PLUGIN_SLOTS } from '@/constants/plugin';
import { createRenderIframe } from '@/lib/pluginIframeManager';
import { pluginLoader, type LoadedPlugin } from '@/lib/pluginLoader';
import { useTheme } from '@/providers/ThemeProvider';
import type { Card } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePluginsOptional } from './PluginProvider';

interface CardBadgeRendererProps {
  card: Card;
}

export function CardBadgeRenderer({ card }: CardBadgeRendererProps) {
  const pluginContext = usePluginsOptional();
  const plugins = pluginContext?.plugins || [];
  const loading = pluginContext?.loading ?? true;

  // Only render for ready plugins with card-badges capability
  const readyPlugins = plugins.filter(p =>
    p.ready &&
    p.installation.plugin.capabilities?.some(cap => cap.capability === PLUGIN_CAPABILITIES.CARD_BADGES)
  );

  if (loading || readyPlugins.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
      {readyPlugins.map((plugin) => {
        // console.log('[CardBadgeRenderer] Plugin settings:', plugin.installation.id, plugin.context.settings);
        return (
          <PluginBadgeIframe
            key={`${plugin.installation.id}-${JSON.stringify(plugin.context.settings)}`}
            plugin={plugin}
            card={card}
          />
        );
      })}
    </div>
  );
}

interface PluginBadgeIframeProps {
  plugin: LoadedPlugin;
  card: Card;
}

function PluginBadgeIframe({ plugin, card }: PluginBadgeIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  // Handle resize messages from the iframe
  const handleResize = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const { installationId, slotType, height: newHeight } = customEvent.detail;

    if (
      installationId === plugin.installation.id &&
      slotType === PLUGIN_SLOTS.CARD_BADGE &&
      newHeight >= 0
    ) {
      setHeight(newHeight);
    }
  }, [plugin.installation.id]);

  useEffect(() => {
    // Listen for resize events
    window.addEventListener('plugin:render:resize', handleResize);

    return () => {
      window.removeEventListener('plugin:render:resize', handleResize);
    };
  }, [handleResize]);

  // Handle theme updates
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'mello:theme:updated',
        theme: resolvedTheme
      }, '*');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build render context
    const renderContext = {
      card: {
        id: card.id,
        title: card.title,
        description: card.description,
        position: card.position,
        list_id: card.list_id,
      },
      plugin: {
        id: plugin.installation.plugin_id,
        installationId: plugin.installation.id,
      },
      settings: plugin.context.settings || {},
      theme: resolvedTheme,
    };

    // Create the render iframe
    const iframe = createRenderIframe(
      plugin.installation,
      PLUGIN_SLOTS.CARD_BADGE,
      renderContext
    );

    // Store ref
    iframeRef.current = iframe;

    // Append to container
    containerRef.current.appendChild(iframe);

    // Register render frame (must be done after append so contentWindow exists)
    pluginLoader.registerRenderFrame(iframe, plugin.installation.id);

    // Cleanup
    return () => {
      if (iframeRef.current) {
        pluginLoader.unregisterRenderFrame(iframe);
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, [card.id, plugin.installation.id]); // Intentional: theme change handled by separate effect

  // Update iframe height when it changes
  useEffect(() => {
    if (iframeRef.current && height !== null && height > 0) {
      iframeRef.current.style.height = `${height}px`;
    }
  }, [height]);

  // Wait for initial resize
  if (height === null) {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'inline-block',
          width: 0,
          height: 0,
          opacity: 0,
          overflow: 'hidden',
        }}
      />
    );
  }

  // Explicitly hidden
  if (height === 0) {
    return (
      <div ref={containerRef} style={{ display: 'none' }} />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-block',
        height: height,
        overflow: 'hidden',
      }}
    />
  );
}

export default CardBadgeRenderer;
