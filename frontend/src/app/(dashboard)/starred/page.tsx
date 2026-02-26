'use client';

import React, { useEffect } from 'react';
import { useAppToken } from '@/hooks/useAppToken';
import { useRouter } from 'next/navigation';
import { Typography, Spin, Empty, Card, Row, Col } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useHeader } from '@/providers/HeaderProvider';
import { useStarredBoards, useUpdateBoard } from '@/hooks/useBoards';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

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
            <Title level={4} style={{ margin: 0 }}>{t('UI_STARRED_BOARDS')}</Title>
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
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {boards.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('UI_NO_STARRED_BOARDS')}
                />
            ) : (
                <Row gutter={[16, 16]}>
                    {boards.map((board) => (
                        <Col key={board.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                hoverable
                                style={{
                                    background: board.background_image
                                        ? `url(${board.background_image}) center/cover`
                                        : board.background_color || token.colorTemplateCover,
                                    borderRadius: 8,
                                    height: 100,
                                }}
                                styles={{
                                    body: {
                                        padding: 12,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }
                                }}
                                onClick={() => handleBoardClick(board.id)}
                            >
                                <Text
                                    strong
                                    style={{
                                        color: token.colorWhite,
                                        fontSize: 16,
                                        textShadow: `0 1px 2px ${token.colorShadowHeavy}`,
                                    }}
                                    ellipsis
                                >
                                    {board.title}
                                </Text>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <StarFilled
                                        style={{
                                            color: token.colorStarYellow,
                                            cursor: 'pointer',
                                            fontSize: 18,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStar(board.id);
                                        }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}
