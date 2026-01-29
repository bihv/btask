/**
 * ViewStats Component
 * Displays detailed view statistics for a card
 */

import { useEffect, useState } from 'react';
import { Card, Typography, Spin, Empty, ConfigProvider, theme } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { melloApi, STORAGE_KEY } from '../api';

const { Title, Text } = Typography;

interface ViewStatsProps {
  card: any;
  initialTheme: string;
}

interface ViewData {
  count: number;
}

/**
 * Component to display stats in the 'card-back-section' slot.
 * It fetches the view count and listens for real-time updates.
 */
export function ViewStats({ card, initialTheme }: ViewStatsProps) {
  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(initialTheme || 'light');

  const fetchData = async () => {
    try {
      const result: any = await melloApi.get('card', card.id, STORAGE_KEY);
      setData(result || { count: 0 });
    } catch (err) {
      console.error('[ViewStats] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for updates
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'mello:data:updated') {
        const { scope, entityId, key } = event.data.data || {};
        if (scope === 'card' && entityId === card.id && key === STORAGE_KEY) {
          fetchData();
        }
      }
      if (event.data?.type === 'mello:theme:updated') {
        setCurrentTheme(event.data.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [card.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  if (!data || data.count === 0) {
    return <Empty description="No views yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <ConfigProvider theme={{
      algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }}>
      <Card
        title={<><EyeOutlined /> View Statistics</>}
        variant="borderless"
        styles={{
          body: {
            padding: 0
          },
          header: {
            padding: '0 0 12px 0',
            border: 'none',
            minHeight: 'auto'
          }
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>TOTAL VIEWS</Text>
          <Title level={4} style={{ margin: 0 }}>{data.count}</Title>
        </div>
      </Card>
    </ConfigProvider>
  );
}
