import { useEffect, useState } from 'react';
import { Tag, ConfigProvider, theme } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { melloApi, STORAGE_KEY } from '../api';



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

    if (count === null) return <Tag className="text-xs">...</Tag>;

    // Use ConfigProvider to inherit Mello's theme (Light/Dark)
    return (
        <ConfigProvider theme={{
            algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
                fontSize: 12,
                paddingXS: 4
            }
        }}>
            <Tag
                color="default"
                style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4, height: 20, border: 'none', background: currentTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                title={`${count} views`}
            >
                <EyeOutlined /> {count}
            </Tag>
        </ConfigProvider>
    );
};
