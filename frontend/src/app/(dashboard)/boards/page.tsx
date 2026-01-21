'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Typography,
    Button,
    Modal,
    Form,
    Input,
    Empty,
    Spin,
    App,
    Select,
} from 'antd';
import {
    PlusOutlined,
    ProjectOutlined,
    TeamOutlined,
    SettingOutlined,
    ClockCircleOutlined,
    AppstoreOutlined,
    StarOutlined,
} from '@ant-design/icons';
import { CreateBoardRequest, Board, Workspace } from '@/types';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useCreateBoard, useStarredBoards, useRecentlyViewedBoards, useUpdateBoard } from '@/hooks/useBoards';
import BackgroundPicker from '@/components/board/BackgroundPicker';
import BoardCard from '@/components/board/BoardCard';
import styles from './boards.module.css';

const { Title, Text } = Typography;



// Create new board card
function CreateBoardCard({ onClick }: { onClick: () => void }) {
    return (
        <div className={styles.createBoardCard} onClick={onClick}>
            <span>Create new board</span>
        </div>
    );
}

// View more boards card
function ViewMoreCard({ hiddenCount, onClick }: { hiddenCount: number; onClick: () => void }) {
    return (
        <div className={styles.createBoardCard} onClick={onClick}>
            <span>+ {hiddenCount} more boards</span>
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
                    <Text strong className={styles.workspaceName}>
                        {workspace.name}
                    </Text>
                </div>
                <div className={styles.workspaceActions}>
                    <Button
                        type="text"
                        size="small"
                        icon={<ProjectOutlined />}
                        onClick={() => router.push(`/workspace/${workspace.id}/boards`)}
                    >
                        Boards
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<TeamOutlined />}
                        onClick={() => router.push(`/workspace/${workspace.id}/members`)}
                    >
                        Members
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => router.push(`/workspace/${workspace.id}/settings`)}
                    >
                        Settings
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
                    />
                )}
                <CreateBoardCard onClick={() => onCreateBoard(workspace.id)} />
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
                <StarOutlined />
                <Title level={5} style={{ margin: 0 }}>
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
                <ClockCircleOutlined />
                <Title level={5} style={{ margin: 0 }}>
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
    const { message } = App.useApp();
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [boardForm] = Form.useForm();


    // Watch form values
    const backgroundColor = Form.useWatch('background_color', boardForm);
    const backgroundImage = Form.useWatch('background_image', boardForm);

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

    const handleCreateBoard = async (values: CreateBoardRequest) => {
        if (!selectedWorkspaceId) return;
        try {
            const newBoard = await createBoardMutation.mutateAsync(values);
            message.success('Board created successfully');
            setCreateBoardModalOpen(false);
            boardForm.resetFields();
            router.push(`/boards/${newBoard.id}`);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        }
    };



    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
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
                    <Title level={5} style={{ margin: 0 }}>
                        YOUR WORKSPACES
                    </Title>
                </div>

                {workspaces.length === 0 ? (
                    <Empty
                        description="No workspaces yet"
                        style={{ marginTop: 48, marginBottom: 48 }}
                    >
                        <Button
                            type="primary"
                            onClick={() => {}} // User should use Header Create button
                            disabled
                        >
                            Create your first workspace using the + button above
                        </Button>
                    </Empty>
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
                title="Create board"
                open={createBoardModalOpen}
                onCancel={() => {
                    setCreateBoardModalOpen(false);
                    boardForm.resetFields();
                }}
                footer={null}
                width={400}
            >
                <Form form={boardForm} layout="vertical" onFinish={handleCreateBoard} style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 8 }}>
                    <Form.Item
                        name="title"
                        label="Board title"
                        rules={[{ required: true, message: 'Please enter a board title' }]}
                    >
                        <Input placeholder="Enter board title" autoFocus />
                    </Form.Item>

                    <div style={{ marginBottom: 16 }}>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Background
                        </Typography.Text>
                        <Form.Item name="background_color" noStyle initialValue="#0079bf">
                            <Input type="hidden" />
                        </Form.Item>
                        <Form.Item name="background_image" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                        <BackgroundPicker
                            value={backgroundColor}
                            imageValue={backgroundImage}
                            onChange={(color) => {
                                boardForm.setFieldsValue({
                                    background_color: color,
                                    background_image: '', // Clear image if color is selected
                                });
                            }}
                            onImageChange={(url) => {
                                boardForm.setFieldsValue({
                                    background_image: url,
                                    background_color: '', // Clear color if image is selected
                                });
                            }}
                        />
                    </div>

                    <div className={styles.workspaceLabel}>
                        <Text type="secondary">
                            Workspace: <strong>{selectedWorkspace?.name}</strong>
                        </Text>
                    </div>
                    <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={createBoardMutation.isPending}
                        >
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>


        </div>
    );
}
