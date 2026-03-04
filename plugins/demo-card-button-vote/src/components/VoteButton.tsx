import { Button, createTheme, MantineProvider } from '@mantine/core';
import { useEffect, useState } from 'react';
import { melloApi, STORAGE_KEY } from '../api';

// Match the host app's Mantine theme
const pluginTheme = createTheme({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'sm',
});

interface VoteButtonProps {
  card: { id: string; title: string };
  initialTheme: 'light' | 'dark';
}

export function VoteButton({ card, initialTheme }: VoteButtonProps) {
  const [votes, setVotes] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme);

  // Listen for theme updates
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'mello:theme:updated') {
        setThemeMode(event.data.theme);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: any = await melloApi.get('card', card.id, STORAGE_KEY);
        setVotes(data?.count || 0);
      } catch (err) {
        console.error('Failed to fetch votes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [card.id]);

  const handleVote = async () => {
    setLoading(true);
    try {
      const newCount = hasVoted ? votes - 1 : votes + 1;
      await melloApi.set('card', card.id, STORAGE_KEY, { count: newCount });
      setVotes(newCount);
      setHasVoted(!hasVoted);
    } catch (err) {
      console.error('Failed to update vote', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MantineProvider theme={pluginTheme} forceColorScheme={themeMode}>
      <Button
        variant={hasVoted ? 'filled' : 'default'}
        size="sm"
        leftSection={<span>{hasVoted ? '👍' : '👍'}</span>}
        onClick={handleVote}
        loading={loading}
        color={hasVoted ? 'blue' : undefined}
      >
        {hasVoted ? 'Voted' : 'Vote'} {votes > 0 && `(${votes})`}
      </Button>
    </MantineProvider>
  );
}
