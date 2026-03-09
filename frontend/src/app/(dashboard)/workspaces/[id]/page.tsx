'use client';

import BoardCard from '@/components/board/BoardCard';
import CreateBoardModal, { CreateBoardData } from '@/components/board/CreateBoardModal';
import { useArchivedBoards, useCreateBoard, useDeleteBoard, useUpdateBoard } from '@/hooks/useBoards';
import { useWorkspace } from '@/hooks/useWorkspaces';
import { useHeader } from '@/providers/HeaderProvider';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Board } from '@/types';
import { Button, Center, Loader, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconArrowLeft, IconPlus, IconSettings } from '@tabler/icons-react';
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
    const deleteMutation = useDeleteBoard();

    const [archivedModalOpen, setArchivedModalOpen] = useState(false);
    const { data: archivedBoards = [], isLoading: isLoadingArchived, refetch: refetchArchived } = useArchivedBoards(workspaceId);

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

    const handleRestoreBoard = async (boardId: string) => {
        try {
            await updateMutation.mutateAsync({ id: boardId, data: { is_archived: false } });
            notifications.show({ title: 'Success', message: 'Board restored', color: 'green' });
            refetchArchived();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to restore board', color: 'red' });
        }
    };

    const handleDeleteArchivedBoard = async (boardId: string) => {
        try {
            await deleteMutation.mutateAsync(boardId);
            notifications.show({ title: 'Success', message: 'Board deleted permanently', color: 'green' });
            refetchArchived();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to delete board', color: 'red' });
        }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {boards.length > 0 && (
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={() => setModalOpen(true)}
                            >
                                Create Board
                            </Button>
                        )}
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconArchive size={16} />}
                            onClick={() => {
                                setArchivedModalOpen(true);
                                refetchArchived();
                            }}
                        >
                            Archived
                        </Button>
                        <Button
                            variant="light"
                            leftSection={<IconSettings size={16} />}
                            onClick={() => router.push(`/workspace/${workspace.id}/settings`)}
                        >
                            Settings
                        </Button>
                    </div>
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

            <Modal
                title="Archived Boards"
                opened={archivedModalOpen}
                onClose={() => setArchivedModalOpen(false)}
                size="lg"
            >
                {isLoadingArchived ? (
                    <Center py={24}><div className="loader" /></Center>
                ) : archivedBoards.length === 0 ? (
                    <Text ta="center" c="dimmed" py={24}>No archived boards</Text>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {archivedBoards.map((board: Board) => (
                            <div key={board.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border-color)', borderRadius: 4 }}>
                                <div>
                                    <Text fw={500}>{board.title}</Text>
                                    <Text size="sm" c="dimmed">Archived at: {board.archived_at ? new Date(board.archived_at).toLocaleDateString() : 'Unknown'}</Text>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button size="sm" variant="light" onClick={() => handleRestoreBoard(board.id)}>Restore</Button>
                                    <Button size="sm" variant="light" color="red" onClick={() => handleDeleteArchivedBoard(board.id)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
