import { Badge, createTheme, MantineProvider } from '@mantine/core';
import { useEffect, useState } from 'react';
import { melloApi, STORAGE_KEY } from '../api';

// Match the host app's Mantine theme
const pluginTheme = createTheme({
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    defaultRadius: 'sm',
});

interface CardBadgeProps {
    card: any;
    initialTheme: string;
}

/**
 * CardBadge Component
 * Displays a view count badge on the card front.
 */
export const CardBadge = ({ card, initialTheme }: CardBadgeProps) => {
    const [count, setCount] = useState<number | null>(null);
    const [currentTheme, setCurrentTheme] = useState(initialTheme || 'light');

    const fetchCount = async () => {
        try {
            const data: any = await melloApi.get('card', card.id, STORAGE_KEY);
            setCount(data?.count || 0);
        } catch (err) {
            console.error('[ViewCounter] Error fetching count:', err);
        }
    };

    useEffect(() => {
        fetchCount();

        // Listen for updates
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'mello:data:updated') {
                const { scope, entityId, key } = event.data.data || {};
                if (scope === 'card' && entityId === card.id && key === STORAGE_KEY) {
                    console.log('[ViewCounter] Received update, refreshing...');
                    fetchCount();
                }
            }
            if (event.data?.type === 'mello:theme:updated') {
                setCurrentTheme(event.data.theme);
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [card.id]);

    return (
        <MantineProvider theme={pluginTheme} forceColorScheme={currentTheme === 'dark' ? 'dark' : 'light'}>
            {count === null ? (
                <Badge variant="light" color="gray" size="sm">...</Badge>
            ) : (
                <Badge
                    variant="light"
                    color="gray"
                    size="sm"
                    leftSection={<span style={{ fontSize: 11 }}>👁</span>}
                    title={`${count} views`}
                    style={{ textTransform: 'none' }}
                >
                    {count}
                </Badge>
            )}
        </MantineProvider>
    );
};
