/**
 * Card Back Section Renderer
 * Renders plugin sections in card details using iframes
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createRenderIframe, type PluginSlotType } from '@/lib/pluginIframeManager';
import { usePluginsOptional } from './PluginProvider';
import { useTheme } from '@/providers/ThemeProvider';
import type { Card } from '@/types';
import { pluginLoader, type LoadedPlugin } from '@/lib/pluginLoader';
import { PLUGIN_CAPABILITIES, PLUGIN_SLOTS } from '@/constants/plugin';

interface CardBackSectionRendererProps {
    card: Card;
}

export function CardBackSectionRenderer({ card }: CardBackSectionRendererProps) {
    const pluginContext = usePluginsOptional();
    const plugins = pluginContext?.plugins || [];
    const loading = pluginContext?.loading ?? true;

    // Only render for ready plugins with card-back-section capability
    const readyPlugins = plugins.filter(p => {
        const hasCap = p.installation.plugin.capabilities?.some(cap => cap.capability === PLUGIN_CAPABILITIES.CARD_BACK_SECTION);
        return p.ready && hasCap;
    });

    if (loading || readyPlugins.length === 0) {
        return null;
    }

    return (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {readyPlugins.map((plugin) => (
                <PluginSectionIframe
                    key={`${plugin.installation.id}-${JSON.stringify(plugin.context.settings)}`}
                    plugin={plugin}
                    card={card}
                />
            ))}
        </div>
    );
}

interface PluginSectionIframeProps {
    plugin: LoadedPlugin;
    card: Card;
}

function PluginSectionIframe({ plugin, card }: PluginSectionIframeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [height, setHeight] = useState(0);
    const { resolvedTheme } = useTheme();

    // Handle resize messages from the iframe
    const handleResize = useCallback((event: Event) => {
        const customEvent = event as CustomEvent;
        const { installationId, slotType, height: newHeight } = customEvent.detail;

        if (
            installationId === plugin.installation.id &&
            slotType === PLUGIN_SLOTS.CARD_BACK_SECTION &&
            newHeight > 0
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
                due_date: card.due_date,
                members: card.members,
                labels: card.labels,
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
            PLUGIN_SLOTS.CARD_BACK_SECTION,
            renderContext
        );

        // Store ref for theme updates and cleanup
        iframeRef.current = iframe;

        // Append to container
        containerRef.current.appendChild(iframe);

        // Register render frame (must be done after append so contentWindow exists)
        pluginLoader.registerRenderFrame(iframe, plugin.installation.id);

        // Cleanup
        return () => {
            pluginLoader.unregisterRenderFrame(iframe);
            iframe.remove();
            iframeRef.current = null;
        };
    }, [card.id, plugin.installation.id]); // Intentional: theme change handled by separate effect

    // Update iframe height when it changes
    useEffect(() => {
        if (iframeRef.current && height > 0) {
            iframeRef.current.style.height = `${height}px`;
        }
    }, [height]);

    // Don't render visible container if no height yet (iframe hasn't loaded)
    if (height === 0) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    minHeight: 100,
                }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: height,
                overflow: 'hidden',
                borderRadius: 8,
            }}
        />
    );
}

export default CardBackSectionRenderer;

