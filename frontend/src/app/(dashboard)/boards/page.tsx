'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateBoardRequest, Board, Workspace } from '@/types';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useCreateBoard, useStarredBoards, useRecentlyViewedBoards, useUpdateBoard } from '@/hooks/useBoards';
import BackgroundPicker from '@/components/board/BackgroundPicker';
import BoardCard from '@/components/board/BoardCard';
import styles from './boards.module.css';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Button, Modal, TextInput, Center, Loader, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconLayoutBoard, IconUsers, IconSettings, IconClock, IconApps, IconStar } from '@tabler/icons-react';
// Create new board card
function CreateBoardCard({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <div className={styles.createBoardCard} onClick={onClick}>
            <span>{label}</span>
        </div>
    );
}

// View more boards card
function ViewMoreCard({ hiddenCount, onClick, label }: { hiddenCount: number; onClick: () => void; label: string }) {
    return (
        <div className={styles.createBoardCard} onClick={onClick}>
            <span>+ {hiddenCount} {label}</span>
        </div>
    );
}

// Workspace section component
function WorkspaceSection({
    workspace,
    onCreateBoard,
    router,
    onToggleStar,
}: {
    workspace: Workspace;
    onCreateBoard: (workspaceId: string) => void;
    router: ReturnType<typeof useRouter>;
    onToggleStar: (boardId: string, isStarred: boolean) => void;
}) {
    const t = useTranslation();
    const boards = workspace.boards || [];
    const initial = workspace.name.charAt(0).toUpperCase();

    // Limit displayed boards logic
    const MAX_DISPLAY = 8;
    const totalBoards = boards.length;
    const showViewMore = totalBoards > MAX_DISPLAY;
    // If showing "View More", we use one slot for it, so we show MAX_DISPLAY - 1 boards.
    // Wait, if MAX_DISPLAY is 8, and we have 9 boards.
    // We show 7 boards + 1 ViewMore + 1 Create = 9 cards.
    // If we just sliced to 8, we would show 8 boards + 1 Create = 9 cards.
    // So visual balance is kept.
    const displayedBoards = showViewMore ? boards.slice(0, MAX_DISPLAY - 1) : boards.slice(0, MAX_DISPLAY);
    const hiddenCount = totalBoards - displayedBoards.length;

    // Generate gradient based on workspace name
    const getGradient = (name: string) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <div className={styles.workspaceSection}>
            <div className={styles.workspaceHeader}>
                <div
                    className={styles.workspaceInfo}
                    onClick={() => router.push(`/workspaces/${workspace.id}`)}
                >
                    <div
                        className={styles.workspaceIcon}
                        style={{ background: getGradient(workspace.name) }}
                    >
                        {initial}
                    </div>
                    <Text fw={700} className={styles.workspaceName}>
                        {workspace.name}
                    </Text>
                </div>
                <div className={styles.workspaceActions}>
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconLayoutBoard size={16} />}
                        onClick={() => router.push(`/workspace/${workspace.id}/boards`)}
                    >
                        {t('UI_BOARDS')}
                    </Button>
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconUsers size={16} />}
                        onClick={() => router.push(`/workspace/${workspace.id}/members`)}
                    >
                        {t('UI_WORKSPACE_MEMBERS')}
                    </Button>
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconSettings size={16} />}
                        onClick={() => router.push(`/workspace/${workspace.id}/settings`)}
                    >
                        {t('UI_SETTINGS')}
                    </Button>
                </div>
            </div>
            <div className={styles.boardsGrid}>
                {displayedBoards.map((board) => (
                    <BoardCard
                        key={board.id}
                        board={board}
                        className={styles.boardCard}
                        onClick={() => router.push(`/boards/${board.id}`)}
                        onToggleStar={onToggleStar}
                    />
                ))}
                {showViewMore && (
                    <ViewMoreCard
                        hiddenCount={hiddenCount}
                        onClick={() => router.push(`/workspace/${workspace.id}/boards`)}
                        label={t('UI_MORE_BOARDS')}
                    />
                )}
                <CreateBoardCard onClick={() => onCreateBoard(workspace.id)} label={t('UI_CREATE_NEW_BOARD')} />
            </div>
        </div>
    );
}

// Starred boards section
function StarredBoardsSection({
    boards,
    router,
    onToggleStar,
}: {
    boards: Board[];
    router: ReturnType<typeof useRouter>;
    onToggleStar: (boardId: string, isStarred: boolean) => void;
}) {
    if (boards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <IconStar size={16} />
                <Title order={5} style={{ margin: 0 }}>
                    Starred boards
                </Title>
            </div>
            <div className={styles.boardsGrid}>
                {boards.map((board) => (
                    <BoardCard
                        key={board.id}
                        board={board}
                        className={styles.boardCard}
                        onClick={() => router.push(`/boards/${board.id}`)}
                        onToggleStar={onToggleStar}
                    />
                ))}
            </div>
        </div>
    );
}

// Recently viewed section (placeholder - needs backend API)
function RecentlyViewedSection({
    boards,
    router,
    onToggleStar,
}: {
    boards: Board[];
    router: ReturnType<typeof useRouter>;
    onToggleStar: (boardId: string, isStarred: boolean) => void;
}) {
    if (boards.length === 0) return null;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <IconClock size={16} />
                <Title order={5} style={{ margin: 0 }}>
                    Recently viewed
                </Title>
            </div>
            <div className={styles.boardsGrid}>
                {boards.slice(0, 4).map((board) => (
                    <BoardCard
                        key={board.id}
                        board={board}
                        className={styles.boardCard}
                        onClick={() => router.push(`/boards/${board.id}`)}
                        onToggleStar={onToggleStar}
                    />
                ))}
            </div>
        </div>
    );
}

export default function BoardsPage() {
    const router = useRouter();
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const t = useTranslation();

    // Board form state
    const form = useForm({
        initialValues: {
            title: '',
            background_color: '',
            background_image: '',
        }
    });

    // React Query hooks
    const { data: workspaces = [], isLoading } = useWorkspaces();
    const { data: starredBoards = [] } = useStarredBoards();
    const { data: recentlyViewedBoards = [] } = useRecentlyViewedBoards();
    const updateMutation = useUpdateBoard();

    const toggleStar = (boardId: string, isStarred: boolean) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: !isStarred } });
    };

    // Get the selected workspace for board creation
    const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
    const createBoardMutation = useCreateBoard(selectedWorkspaceId || '');

    const handleOpenCreateBoard = (workspaceId: string) => {
        setSelectedWorkspaceId(workspaceId);
        setCreateBoardModalOpen(true);
    };

    const handleCreateBoard = async (values: typeof form.values) => {
        if (!selectedWorkspaceId || !values.title.trim()) return;
        try {
            const newBoard = await createBoardMutation.mutateAsync({
                title: values.title,
                background_color: values.background_color,
                background_image: values.background_image,
            });
            setCreateBoardModalOpen(false);
            form.reset();
            router.push(`/boards/${newBoard.id}`);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_CREATE_BOARD'), color: 'red' });
        }
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader size="lg" />
            </div>
        );
    }

    // Background color options for board creation (Moved to BackgroundPicker component)

    return (
        <div className={styles.container}>
            {/* Starred Boards Section */}
            <StarredBoardsSection boards={starredBoards} router={router} onToggleStar={toggleStar} />

            {/* Recently Viewed Section */}
            <RecentlyViewedSection boards={recentlyViewedBoards} router={router} onToggleStar={toggleStar} />

            {/* Your Workspaces Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Title order={5} style={{ margin: 0 }}>
                        YOUR WORKSPACES
                    </Title>
                </div>

                {workspaces.length === 0 ? (
                    <Center py={48}>
                        <div style={{ textAlign: 'center' }}>
                            <Text c="dimmed" mb={16}>{t('UI_NO_WORKSPACES_YET')}</Text>
                            <Button
                                onClick={() => { }}
                                disabled
                            >
                                {t('UI_CREATE_FIRST_WORKSPACE')}
                            </Button>
                        </div>
                    </Center>
                ) : (
                    <>
                        {workspaces.map((workspace) => (
                            <WorkspaceSection
                                key={workspace.id}
                                workspace={workspace}
                                onCreateBoard={handleOpenCreateBoard}
                                router={router}
                                onToggleStar={toggleStar}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Create Board Modal */}
            <Modal
                title={t('UI_CREATE_BOARD')}
                opened={createBoardModalOpen}
                onClose={() => {
                    setCreateBoardModalOpen(false);
                    form.reset();
                }}
                size="md"
            >
                <form onSubmit={form.onSubmit(handleCreateBoard)} style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 8 }}>
                    <div>
                        <TextInput
                            placeholder={t('UI_PLACEHOLDER_BOARD_TITLE')}
                            autoFocus
                            {...form.getInputProps('title')}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>
                            {t('UI_BACKGROUND')}
                        </Text>
                        <BackgroundPicker
                            value={form.values.background_color}
                            imageValue={form.values.background_image}
                            onChange={(color) => {
                                form.setFieldValue('background_color', color);
                                form.setFieldValue('background_image', '');
                            }}
                            onImageChange={(url) => {
                                form.setFieldValue('background_image', url);
                                form.setFieldValue('background_color', '');
                            }}
                        />
                    </div>

                    <div className={styles.workspaceLabel}>
                        <Text c="dimmed">
                            Workspace: <strong>{selectedWorkspace?.name}</strong>
                        </Text>
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
