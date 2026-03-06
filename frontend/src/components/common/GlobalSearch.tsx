'use client';

import { useTranslation } from '@/hooks/useLabels';
import api from '@/lib/api';
import { Loader, Text, TextInput } from '@mantine/core';
import { IconCreditCard, IconLayoutBoard, IconSearch, IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
    workspaces: Array<{ id: string; name: string }>;
    boards: Array<{ id: string; title: string; workspace_name?: string }>;
    cards: Array<{ id: string; title: string; board_id: string; board_title?: string }>;
}

export default function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const t = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (debouncedQuery.trim().length < 2) {
            setResults(null);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await api.get('/search', { params: { q: debouncedQuery } });
                setResults(res.data.data);
            } catch (error) {
                console.error('Search failed:', error);
                setResults(null);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type: 'workspace' | 'board' | 'card', id: string, boardId?: string) => {
        setQuery('');
        setIsOpen(false);
        setResults(null);

        switch (type) {
            case 'workspace':
                router.push(`/workspaces/${id}`);
                break;
            case 'board':
                router.push(`/boards/${id}`);
                break;
            case 'card':
                router.push(`/boards/${boardId}/cards/${id}`);
                break;
        }
    };

    const hasResults = results && (
        results.workspaces.length > 0 ||
        results.boards.length > 0 ||
        results.cards.length > 0
    );

    return (
        <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 600 }}>
            <TextInput
                placeholder={t('UI_SEARCH_PLACEHOLDER')}
                leftSection={<IconSearch size={16} color="var(--text-secondary)" />}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                onFocus={() => setIsOpen(true)}
                style={{
                    borderRadius: 8,
                }}
                rightSection={query ? undefined : undefined}
            />

            {isOpen && query.trim().length >= 2 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: 'var(--bg-secondary)',
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                        border: '1px solid var(--border-color)',
                        maxHeight: 400,
                        overflow: 'auto',
                        zIndex: 1000,
                    }}
                >
                    {loading ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <Loader size="sm" />
                        </div>
                    ) : !hasResults ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <Text c="dimmed">{t('UI_NO_RESULTS')}</Text>
                        </div>
                    ) : (
                        <>
                            {/* Workspaces */}
                            {results.workspaces.length > 0 && (
                                <div>
                                    <div style={{
                                        padding: '8px 12px 2px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <IconUsers size={12} />
                                        {t('UI_WORKSPACES')}
                                    </div>
                                    {results.workspaces.map((ws) => (
                                        <div
                                            key={ws.id}
                                            onClick={() => handleSelect('workspace', ws.id)}
                                            style={{
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Text>{ws.name}</Text>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Boards */}
                            {results.boards.length > 0 && (
                                <div>
                                    <div style={{
                                        padding: '8px 12px 2px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <IconLayoutBoard size={12} />
                                        {t('UI_BOARDS')}
                                    </div>
                                    {results.boards.map((board) => (
                                        <div
                                            key={board.id}
                                            onClick={() => handleSelect('board', board.id)}
                                            style={{
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Text>{board.title}</Text>
                                            {board.workspace_name && (
                                                <Text c="dimmed" size="xs" ml="xs">
                                                    {t('UI_IN')} {board.workspace_name}
                                                </Text>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Cards */}
                            {results.cards.length > 0 && (
                                <div>
                                    <div style={{
                                        padding: '8px 12px 2px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <IconCreditCard size={12} />
                                        {t('UI_CARDS')}
                                    </div>
                                    {results.cards.map((card) => (
                                        <div
                                            key={card.id}
                                            onClick={() => handleSelect('card', card.id, card.board_id)}
                                            style={{
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Text>{card.title}</Text>
                                            {card.board_title && (
                                                <Text c="dimmed" size="xs" ml="xs">
                                                    {t('UI_IN')} {card.board_title}
                                                </Text>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
