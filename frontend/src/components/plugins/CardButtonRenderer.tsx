/**
 * Card Button Renderer
 * Renders plugin buttons in the card sidebar
 */

'use client';

import { PLUGIN_CAPABILITIES, PLUGIN_SLOTS } from '@/constants/plugin';
import { createRenderIframe } from '@/lib/pluginIframeManager';
import { pluginLoader, type LoadedPlugin } from '@/lib/pluginLoader';
import { useTheme } from '@/providers/ThemeProvider';
import type { Card } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePluginsOptional } from './PluginProvider';

interface CardButtonRendererProps {
    card: Card;
}

export function CardButtonRenderer({ card }: CardButtonRendererProps) {
    const pluginContext = usePluginsOptional();
    const plugins = pluginContext?.plugins || [];
    const loading = pluginContext?.loading ?? true;

    // Only render for ready plugins with card-buttons capability
    const readyPlugins = plugins.filter(p =>
        p.ready &&
        p.installation.plugin.capabilities?.some(cap => cap.capability === PLUGIN_CAPABILITIES.CARD_BUTTONS)
    );

    if (loading || readyPlugins.length === 0) {
        return null;
    }

    return (
        <>
            {readyPlugins.map((plugin) => (
                <PluginButtonIframe
                    key={`${plugin.installation.id}-${JSON.stringify(plugin.context.settings)}`}
                    plugin={plugin}
                    card={card}
                />
            ))}
        </>
    );
}

interface PluginButtonIframeProps {
    plugin: LoadedPlugin;
    card: Card;
}

function PluginButtonIframe({ plugin, card }: PluginButtonIframeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [height, setHeight] = useState<number | null>(null);
    const [width, setWidth] = useState<number | null>(null);
    const { resolvedTheme } = useTheme();

    // Handle resize messages from the iframe
    const handleResize = useCallback((event: Event) => {
        const customEvent = event as CustomEvent;
        const { installationId, slotType, height: newHeight, width: newWidth } = customEvent.detail;

        if (
            installationId === plugin.installation.id &&
            slotType === PLUGIN_SLOTS.CARD_BUTTON
        ) {
            if (newHeight >= 0) setHeight(newHeight);
            if (newWidth >= 0) setWidth(newWidth);
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
            PLUGIN_SLOTS.CARD_BUTTON,
            renderContext
        );

        // Store ref
        iframeRef.current = iframe;

        // Append to container
        containerRef.current.appendChild(iframe);

        // Register render frame
        pluginLoader.registerRenderFrame(iframe, plugin.installation.id);

        // Cleanup
        return () => {
            if (iframeRef.current) {
                pluginLoader.unregisterRenderFrame(iframe);
                iframeRef.current.remove();
                iframeRef.current = null;
            }
        };
    }, [card.id, plugin.installation.id]);

    // Update iframe size when it changes
    useEffect(() => {
        if (iframeRef.current) {
            if (height !== null && height > 0) iframeRef.current.style.height = `${height}px`;
            if (width !== null && width > 0) iframeRef.current.style.width = `${width}px`;
        }
    }, [height, width]);

    // Wait for initial resize
    if (height === null) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: 'auto',
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
                // Size determined by iframe content or fixed if needed
                // size is set by effect
                height: height,
                width: width || 'auto',
                overflow: 'hidden',
                verticalAlign: 'middle',
            }}
        />
    );

}

export default CardButtonRenderer;
