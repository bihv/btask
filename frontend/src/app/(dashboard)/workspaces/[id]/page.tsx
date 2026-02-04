'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Row,
    Col,
    Typography,
    Button,
    Empty,
    Spin,
    App,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useHeader } from '@/providers/HeaderProvider';
import { useWorkspace } from '@/hooks/useWorkspaces';
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards';
import CreateBoardModal, { CreateBoardData } from '@/components/board/CreateBoardModal';
import BoardCard from '@/components/board/BoardCard';

const { Title } = Typography;

export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.id as string;
    const { setHeaderContent } = useHeader();

    const [modalOpen, setModalOpen] = useState(false);
    const { message } = App.useApp();

    // React Query hooks - workspace already includes boards
    const { data: workspace, isLoading } = useWorkspace(workspaceId);
    const boards = workspace?.boards || [];
    const createMutation = useCreateBoard(workspaceId);
    const updateMutation = useUpdateBoard();

    const handleCreateBoard = async (data: CreateBoardData) => {
        try {
            await createMutation.mutateAsync({
                title: data.title,
                background_color: data.background_color,
                background_image: data.background_image,
            });
            setModalOpen(false);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        }
    };

    const toggleStar = (boardId: string, isStarred: boolean) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: !isStarred } });
    };

    // Set dynamic header
    useEffect(() => {
        if (workspace) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push('/workspaces')}
                        />
                        <Title level={4} style={{ margin: 0 }}>{workspace.name}</Title>
                    </div>
                    {boards.length > 0 && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalOpen(true)}
                        >
                            Create Board
                        </Button>
                    )}
                </div>
            );
        }
        return () => setHeaderContent(null);
    }, [workspace, boards.length]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {boards.length === 0 ? (
                <Empty description="No boards yet" style={{ marginTop: 48 }}>
                    <Button type="primary" onClick={() => setModalOpen(true)}>
                        Create your first board
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {boards.map((board) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={board.id}>
                            <BoardCard
                                board={board}
                                style={{ minHeight: 100 }}
                                onClick={() => router.push(`/boards/${board.id}`)}
                                onToggleStar={toggleStar}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            <CreateBoardModal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onSubmit={handleCreateBoard}
                loading={createMutation.isPending}
            />
        </div>
    );
}
