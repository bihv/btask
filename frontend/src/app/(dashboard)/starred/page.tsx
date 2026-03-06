'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useStarredBoards, useUpdateBoard } from '@/hooks/useBoards';
import { useTranslation } from '@/hooks/useLabels';
import { useHeader } from '@/providers/HeaderProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Card, Center, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { IconStarFilled } from '@tabler/icons-react';
export default function StarredPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();
    const t = useTranslation();
    const token = useAppToken();

    // React Query hooks
    const { data: boards = [], isLoading } = useStarredBoards();
    const updateMutation = useUpdateBoard();

    useEffect(() => {
        setHeaderContent(
            <Title order={4} style={{ margin: 0 }}>{t('UI_STARRED_BOARDS')}</Title>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    const toggleStar = async (boardId: string) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: false } });
    };

    const handleBoardClick = (boardId: string) => {
        router.push(`/boards/${boardId}`);
    };

    if (isLoading) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {boards.length === 0 ? (
                <Center py="xl"><Text c="dimmed">{t('UI_NO_STARRED_BOARDS')}</Text></Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {boards.map((board) => (
                        <div>
                            <Card
                                withBorder
                                style={{
                                    background: board.background_image
                                        ? `url(${board.background_image}) center/cover`
                                        : board.background_color || token.colorTemplateCover,
                                    borderRadius: 8,
                                    height: 100,
                                }}
                                
                                onClick={() => handleBoardClick(board.id)}
                            >
                                <Text
                                    fw={700}
                                    style={{
                                        color: token.colorWhite,
                                        fontSize: 16,
                                        textShadow: `0 1px 2px ${token.colorShadowHeavy}`,
                                    }}
                                    truncate
                                >
                                    {board.title}
                                </Text>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <div
                                        style={{ cursor: 'pointer', color: '#faad14' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStar(board.id);
                                        }}
                                    >
                                        <IconStarFilled size={18} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </SimpleGrid>
            )}
        </div>
    );
}
