/**
 * ViewStats Component
 * Displays detailed view statistics for a card
 */

import { Card, createTheme, Loader, MantineProvider, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { melloApi, STORAGE_KEY } from '../api';

// Match the host app's Mantine theme
const pluginTheme = createTheme({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'sm',
});

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
      <MantineProvider theme={pluginTheme} forceColorScheme={currentTheme === 'dark' ? 'dark' : 'light'}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Loader size="sm" />
        </div>
      </MantineProvider>
    );
  }

  if (!data || data.count === 0) {
    return (
      <MantineProvider theme={pluginTheme} forceColorScheme={currentTheme === 'dark' ? 'dark' : 'light'}>
        <Text c="dimmed" size="sm" ta="center" py="md">No views yet</Text>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={pluginTheme} forceColorScheme={currentTheme === 'dark' ? 'dark' : 'light'}>
      <Card p={0} bg="transparent" shadow="none">
        <Title order={5} mb={4}>👁 View Statistics</Title>
        <div>
          <Text c="dimmed" size="xs" tt="uppercase">Total Views</Text>
          <Title order={4} mt={0}>{data.count}</Title>
        </div>
      </Card>
    </MantineProvider>
  );
}
