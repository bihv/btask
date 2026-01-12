'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Typography, Button, Input, Spin, message, Dropdown, Modal, Form, Switch, Drawer, Avatar, Divider } from 'antd';
import {
    StarOutlined,
    StarFilled,
    MoreOutlined,
    ArrowLeftOutlined,
    InboxOutlined,
    ShareAltOutlined,
    PictureOutlined,
    InfoCircleOutlined,
    UserOutlined,
    AlignLeftOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { useHeader } from '@/providers/HeaderProvider';
import { useBoard, useUpdateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { useWorkspaceMembers } from '@/hooks/useCards';
import ArchivedItemsDrawer from '@/components/board/ArchivedItemsDrawer';
import CardFilterBar, { FilterState, defaultFilters } from '@/components/board/CardFilterBar';
import ShareModal from '@/components/workspace/ShareModal';
import BackgroundPicker from '@/components/board/BackgroundPicker';

const { Text, Title, Paragraph } = Typography;

export default function BoardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;

    // React Query for fetching board data
    const { data: board, isLoading, refetch } = useBoard(boardId);

    // Zustand store for list/card operations (used by KanbanBoard)
    const { setLists } = useBoardStore();

    // Mutations
    const updateMutation = useUpdateBoard();
    const deleteMutation = useDeleteBoard();

    // Fetch workspace members for filter
    const { data: workspaceMembers = [] } = useWorkspaceMembers(board?.workspace_id || '');

    const { setHeaderContent } = useHeader();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [settingsForm] = Form.useForm();
    const [selectedImage, setSelectedImage] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState('');

    // Sync React Query data to Zustand store for KanbanBoard
    useEffect(() => {
        if (board) {
            setLists(board.lists || []);
            // Also update currentBoard in store for compatibility
            useBoardStore.setState({
                currentBoard: board,
                showCardCovers: board.show_card_covers ?? true,
            });
        }
    }, [board, setLists]);

    useEffect(() => {
        if (board) {
            setTitle(board.title);
        }
    }, [board]);

    const handleTitleSave = async () => {
        if (title.trim() && title !== board?.title) {
            try {
                await updateMutation.mutateAsync({ id: boardId, data: { title: title.trim() } });
                message.success('Board title updated');
                refetch();
            } catch (error) {
                message.error('Failed to update title');
                setTitle(board?.title || '');
            }
        }
        setIsEditing(false);
    };

    const toggleStar = async () => {
        if (!board) return;
        try {
            await updateMutation.mutateAsync({
                id: boardId,
                data: { is_starred: !board.is_starred }
            });
        } catch (error) {
            message.error('Failed to update board');
        }
    };

    const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'settings') {
            settingsForm.setFieldsValue({
                title: board?.title,
                description: board?.description || '',
                background_color: board?.background_color || '#0079bf',
                show_card_covers: board?.show_card_covers ?? true,
            });
            setSelectedImage(board?.background_image || '');
            setSettingsOpen(true);
        } else if (key === 'share') {
            setShareOpen(true);
        } else if (key === 'delete') {
            Modal.confirm({
                title: 'Delete this board?',
                content: 'This action cannot be undone. All lists and cards will be permanently deleted.',
                okText: 'Delete',
                okType: 'danger',
                onOk: async () => {
                    try {
                        await deleteMutation.mutateAsync(boardId);
                        message.success('Board deleted');
                        router.push('/workspaces');
                    } catch (error) {
                        message.error('Failed to delete board');
                    }
                },
            });
        } else if (key === 'archived') {
            setArchivedOpen(true);
        } else if (key === 'about') {
            setDescValue(board?.description || '');
            setAboutOpen(true);
        }
    };

    const handleSettingsSave = async () => {
        try {
            const values = await settingsForm.validateFields();
            const bgColor = selectedImage ? '' : (values.background_color || board?.background_color || '#0079bf');

            await updateMutation.mutateAsync({
                id: boardId,
                data: {
                    title: values.title,
                    description: values.description,
                    background_color: bgColor,
                    background_image: selectedImage,
                    show_card_covers: values.show_card_covers,
                }
            });
            message.success('Board settings updated');
            setSettingsOpen(false);
        } catch (error) {
            message.error('Failed to update board settings');
        }
    };

    // Set dynamic header
    useEffect(() => {
        if (board) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
                    />
                    {isEditing ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onPressEnter={handleTitleSave}
                            autoFocus
                            style={{
                                width: 200,
                                fontWeight: 700,
                                fontSize: 16,
                            }}
                        />
                    ) : (
                        <Text
                            strong
                            style={{ fontSize: 16, cursor: 'pointer' }}
                            onClick={() => setIsEditing(true)}
                        >
                            {board.title}
                        </Text>
                    )}
                    <Button
                        type="text"
                        icon={
                            board.is_starred ? (
                                <StarFilled style={{ color: '#f5cd47' }} />
                            ) : (
                                <StarOutlined />
                            )
                        }
                        onClick={toggleStar}
                    />
                    <Dropdown
                        menu={{
                            items: [
                                { key: 'about', label: 'About this board', icon: <InfoCircleOutlined /> },
                                { key: 'share', label: 'Share', icon: <ShareAltOutlined /> },
                                { key: 'archived', label: 'Archived Items', icon: <InboxOutlined /> },
                                { type: 'divider' },
                                { key: 'settings', label: 'Board Settings' },
                                { key: 'delete', label: 'Delete Board', danger: true },
                            ],
                            onClick: handleMenuClick,
                        }}
                    >
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                </div>
            );
        }
        return () => setHeaderContent(null);
    }, [board, isEditing, title]);

    if (isLoading || !board) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: board.background_image
                    ? `url(${board.background_image}) center/cover fixed`
                    : board.background_color || '#0079bf',
            }}
        >
            {/* Filter Bar */}
            <div style={{ padding: '8px 16px 0' }}>
                <CardFilterBar
                    labels={board.labels || []}
                    members={workspaceMembers}
                    filters={filters}
                    onChange={setFilters}
                />
            </div>

            {/* Kanban Board */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <KanbanBoard filters={filters} />
            </div>


            {/* Board Settings Modal */}
            <Modal
                title="Board Settings"
                open={settingsOpen}
                onCancel={() => setSettingsOpen(false)}
                onOk={handleSettingsSave}
                okText="Save"
            >
                <Form
                    form={settingsForm}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="title"
                        label="Board Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="Enter board title" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea
                            placeholder="Add a description for this board"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item
                        name="background_color"
                        label="Background"
                    >
                        <BackgroundPicker
                            imageValue={selectedImage}
                            onImageChange={setSelectedImage}
                        />
                    </Form.Item>
                    <Form.Item
                        name="show_card_covers"
                        label="Card Covers"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren={<PictureOutlined />} unCheckedChildren={<PictureOutlined />} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Archived Items Drawer */}
            <ArchivedItemsDrawer
                boardId={boardId}
                open={archivedOpen}
                onClose={() => setArchivedOpen(false)}
            />

            {/* Share Modal */}
            <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                workspaceId={board.workspace_id}
                isOwner={true} // TODO: Check actual ownership
            />

            {/* About Board Drawer */}
            <Drawer
                title="About this board"
                placement="right"
                open={aboutOpen}
                onClose={() => {
                    setAboutOpen(false);
                    setIsEditingDesc(false);
                }}
                width={360}
            >
                {/* Board Admin */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <UserOutlined />
                        <Text strong>Board Admin</Text>
                    </div>
                    {workspaceMembers
                        .filter((m: any) => m.role === 'owner')
                        .slice(0, 1)
                        .map((member: any) => (
                            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 24 }}>
                                <Avatar style={{ backgroundColor: '#0052cc' }}>
                                    {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </Avatar>
                                <div>
                                    <div><Text strong>{member.full_name || 'Unknown'}</Text></div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>@{member.email?.split('@')[0]}</Text>
                                </div>
                            </div>
                        ))}
                </div>

                <Divider />

                {/* Description */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlignLeftOutlined />
                            <Text strong>Description</Text>
                        </div>
                        {!isEditingDesc && (
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setIsEditingDesc(true)}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                    {isEditingDesc ? (
                        <div>
                            <Input.TextArea
                                value={descValue}
                                onChange={(e) => setDescValue(e.target.value)}
                                rows={4}
                                placeholder="Add a description for this board..."
                                autoFocus
                            />
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={async () => {
                                        try {
                                            await updateMutation.mutateAsync({
                                                id: boardId,
                                                data: { description: descValue }
                                            });
                                            message.success('Description updated');
                                            setIsEditingDesc(false);
                                        } catch {
                                            message.error('Failed to update');
                                        }
                                    }}
                                >
                                    Save
                                </Button>
                                <Button size="small" onClick={() => setIsEditingDesc(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ paddingLeft: 24 }}>
                            <Paragraph type={board.description ? undefined : 'secondary'}>
                                {board.description || 'No description yet. Click Edit to add one.'}
                            </Paragraph>
                        </div>
                    )}
                </div>
            </Drawer>
        </div>
    );
}
