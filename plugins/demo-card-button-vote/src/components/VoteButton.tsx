import { useEffect, useState } from 'react';
import { Button, ConfigProvider, theme as antTheme } from 'antd';
import { LikeOutlined, LikeFilled } from '@ant-design/icons';
import { melloApi, STORAGE_KEY } from '../api';

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
        // Note: Real user tracking would need userId, here we just simulate "local" state for demo
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
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <div style={{ display: 'inline-flex' }}>
        <Button
          style={{ 
            width: 'auto',
            textAlign: 'left', 
            justifyContent: 'flex-start',
            borderColor: 'transparent',
            background: 'rgba(0,0,0,0.04)'
          }}
          icon={hasVoted ? <LikeFilled /> : <LikeOutlined />}
          onClick={handleVote}
          loading={loading}
          size='small'
        >
          {hasVoted ? 'Voted' : 'Vote'} {votes > 0 && `(${votes})`}
        </Button>
      </div>
    </ConfigProvider>
  );
}
