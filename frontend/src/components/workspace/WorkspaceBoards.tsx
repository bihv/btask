'use client';

import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';
import BoardCard from '@/components/board/BoardCard';
import { useArchivedBoards, useCreateBoard, useDeleteBoard, useUpdateBoard } from '@/hooks/useBoards';
import { useTranslation } from '@/hooks/useLabels';
import { Board, Workspace } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Center, Modal, SimpleGrid, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconPlus } from '@tabler/icons-react';
interface WorkspaceBoardsProps {
    workspace: Workspace;
}

export default function WorkspaceBoards({ workspace }: WorkspaceBoardsProps) {
    const router = useRouter();
    const t = useTranslation();
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [archivedModalOpen, setArchivedModalOpen] = useState(false);

    const form = useForm({
        initialValues: {
            boardTitle: '',
            backgroundColor: '',
            backgroundImage: '',
        },
        validate: {
            boardTitle: (value) => (!value.trim() ? t('UI_PLACEHOLDER_BOARD_TITLE') + ' is required' : null),
        },
    });

    const updateMutation = useUpdateBoard();
    const createBoardMutation = useCreateBoard(workspace.id);
    const deleteMutation = useDeleteBoard();

    const { data: archivedBoards = [], isLoading: isLoadingArchived, refetch: refetchArchived } = useArchivedBoards(workspace.id);

    const toggleStar = (boardId: string, isStarred: boolean) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: !isStarred } });
    };

    const handleCreateBoard = async (values: typeof form.values) => {
        if (!values.boardTitle.trim()) return;
        try {
            const newBoard = await createBoardMutation.mutateAsync({
                title: values.boardTitle,
                background_color: values.backgroundColor,
                background_image: values.backgroundImage,
            });
            setCreateBoardModalOpen(false);
            form.reset();
            router.push(`/boards/${newBoard.id}`);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_CREATE_BOARD'), color: 'red' });
        }
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

    const boards = workspace.boards || [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title order={4} style={{ margin: 0 }}>{t('UI_BOARDS')}</Title>
                <div style={{ display: 'flex', gap: 12 }}>
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
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCreateBoardModalOpen(true)}
                    >
                        {t('UI_CREATE_BOARD')}
                    </Button>
                </div>
            </div>

            {boards.length === 0 ? (
                <Center py={48}>
                    <div style={{ textAlign: 'center' }}>
                        <Text c="dimmed" mb={16}>{t('UI_NO_BOARDS_YET')}</Text>
                        <Button onClick={() => setCreateBoardModalOpen(true)}>
                            {t('UI_CREATE_FIRST_BOARD')}
                        </Button>
                    </div>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {boards.map((board) => (
                        <div key={board.id}>
                            <BoardCard
                                board={board}
                                onClick={() => router.push(`/boards/${board.id}`)}
                                onToggleStar={toggleStar}
                                style={{ minHeight: 100 }}
                            />
                        </div>
                    ))}
                    <div>
                        <div
                            style={{
                                height: 100,
                                borderRadius: 4,
                                border: '1px dashed var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: 'transparent',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-gray-50 dark:hover:bg-dark-600"
                            onClick={() => setCreateBoardModalOpen(true)}
                        >
                            <Text c="dimmed" size="sm" fw={500}>{t('UI_CREATE_NEW_BOARD')}</Text>
                        </div>
                    </div>
                </SimpleGrid>
            )}

            <Modal
                title={t('UI_CREATE_BOARD_MODAL')}
                opened={createBoardModalOpen}
                onClose={() => {
                    setCreateBoardModalOpen(false);
                    form.reset();
                }}
                size="md"
            >
                <form onSubmit={form.onSubmit(handleCreateBoard)}>
                    <div>
                        <TextInput
                            placeholder={t('UI_PLACEHOLDER_BOARD_TITLE')}
                            autoFocus
                            {...form.getInputProps('boardTitle')}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>
                            {t('UI_BACKGROUND')}
                        </Text>
                        <BackgroundPicker
                            value={form.values.backgroundColor || SOLID_COLORS[0]}
                            imageValue={form.values.backgroundImage}
                            onChange={(color) => {
                                form.setFieldValue('backgroundColor', color);
                                form.setFieldValue('backgroundImage', '');
                            }}
                            onImageChange={(url) => {
                                form.setFieldValue('backgroundImage', url);
                                form.setFieldValue('backgroundColor', '');
                            }}
                        />
                    </div>

                    <div>
                        <Button
                            type="submit"
                            fullWidth
                            loading={createBoardMutation.isPending}
                        >
                            {t('UI_CREATE')}
                        </Button>
                    </div>
                </form>
            </Modal>

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
