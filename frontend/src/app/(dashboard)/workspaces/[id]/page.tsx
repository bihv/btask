'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useHeader } from '@/providers/HeaderProvider';
import { useWorkspace } from '@/hooks/useWorkspaces';
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards';
import CreateBoardModal, { CreateBoardData } from '@/components/board/CreateBoardModal';
import BoardCard from '@/components/board/BoardCard';

import { SimpleGrid, Text, Title, Button, Center, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconArrowLeft } from '@tabler/icons-react';
export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.id as string;
    const { setHeaderContent } = useHeader();

    const [modalOpen, setModalOpen] = useState(false);
    
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
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to create board', color: 'red' });
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
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16}  />}
                            onClick={() => router.push('/workspaces')}
                        />
                        <Title order={4} style={{ margin: 0 }}>{workspace.name}</Title>
                    </div>
                    {boards.length > 0 && (
                        <Button
                            
                            leftSection={<IconPlus size={16}  />}
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
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {boards.length === 0 ? (
                <div style={{textAlign: "center",  marginTop: 48 }}>
<Text c="dimmed" mb={16}>No boards yet</Text>
<Button  onClick={() => setModalOpen(true)}>
                        Create your first board
                    </Button>
</div>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {boards.map((board) => (
                        <div key={board.id}>
                            <BoardCard
                                board={board}
                                style={{ minHeight: 100 }}
                                onClick={() => router.push(`/boards/${board.id}`)}
                                onToggleStar={toggleStar}
                            />
                        </div>
                    ))}
                </SimpleGrid>
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
