'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateBoardRequest, Workspace } from '@/types';
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards';
import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';
import BoardCard from '@/components/board/BoardCard';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Button, Modal, TextInput, Center, SimpleGrid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
interface WorkspaceBoardsProps {
    workspace: Workspace;
}

export default function WorkspaceBoards({ workspace }: WorkspaceBoardsProps) {
    const router = useRouter();
    const t = useTranslation();
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);

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

    const boards = workspace.boards || [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title order={4} style={{ margin: 0 }}>{t('UI_BOARDS')}</Title>
                <Button

                    leftSection={<IconPlus size={16} />}
                    onClick={() => setCreateBoardModalOpen(true)}
                >
                    {t('UI_CREATE_BOARD')}
                </Button>
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
                        <div>
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
                                background: 'var(--bg-tertiary)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setCreateBoardModalOpen(true)}
                        >
                            <Text c="dimmed">{t('UI_CREATE_NEW_BOARD')}</Text>
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
        </div>
    );
}
