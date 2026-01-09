'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Spin, Empty, Card, Row, Col } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useHeader } from '@/providers/HeaderProvider';
import { useStarredBoards, useUpdateBoard } from '@/hooks/useBoards';

const { Title, Text } = Typography;

export default function StarredPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();

    // React Query hooks
    const { data: boards = [], isLoading } = useStarredBoards();
    const updateMutation = useUpdateBoard();

    useEffect(() => {
        setHeaderContent(
            <Title level={4} style={{ margin: 0 }}>Starred Boards</Title>
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
                    description="No starred boards yet"
                />
            ) : (
                <Row gutter={[16, 16]}>
                    {boards.map((board) => (
                        <Col key={board.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                hoverable
                                style={{
                                    background: board.background_color || '#0079bf',
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
                                        color: 'white',
                                        fontSize: 16,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
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
                                            color: '#f5cd47',
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
