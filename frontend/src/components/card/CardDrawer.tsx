'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    Drawer,
    Input,
    Button,
    Typography,
    Space,
    Divider,
    DatePicker,
    Checkbox,
    Avatar,
    Tooltip,
    message,
    Spin,
    Popover,
    Tag,
    List as AntList,
    Modal,
} from 'antd';
import {
    AlignLeftOutlined,
    ClockCircleOutlined,
    TagOutlined,
    UserOutlined,
    DeleteOutlined,
    CommentOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card, Comment, Label, User } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Dynamic import to avoid SSR issues with BlockNote
const RichTextEditor = dynamic(() => import('../editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Title, Text } = Typography;
const { TextArea } = Input;

const LABEL_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface CardDrawerProps {
    card: Card | null;
    open: boolean;
    onClose: () => void;
}

export default function CardDrawer({ card, open, onClose }: CardDrawerProps) {
    const { updateCard, deleteCard, currentBoard, fetchBoard } = useBoardStore();
    const { user } = useAuthStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // Popover states
    const [membersOpen, setMembersOpen] = useState(false);
    const [labelsOpen, setLabelsOpen] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);

    // Data for popovers
    const [boardLabels, setBoardLabels] = useState<Label[]>([]);
    const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    useEffect(() => {
        if (open && card) {
            setTitle(card.title);
            setDescription(card.description || '');
            fetchComments();
            fetchBoardLabels();
            fetchWorkspaceMembers();
        }
    }, [open, card]);

    const fetchComments = async () => {
        if (!card) return;
        setLoadingComments(true);
        try {
            const response = await api.get(`/cards/${card.id}/comments`);
            setComments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch comments');
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchBoardLabels = async () => {
        if (!currentBoard?.id) return;
        try {
            const response = await api.get(`/boards/${currentBoard.id}/labels`);
            setBoardLabels(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch labels');
        }
    };

    const fetchWorkspaceMembers = async () => {
        if (!currentBoard?.workspace_id) return;
        try {
            const response = await api.get(`/workspaces/${currentBoard.workspace_id}/members`);
            const members = response.data.data || [];
            setWorkspaceMembers(members.map((m: any) => m.user).filter(Boolean));
        } catch (error) {
            console.error('Failed to fetch members');
        }
    };

    const handleTitleSave = () => {
        if (!card) return;
        if (title.trim() && title !== card.title) {
            updateCard(card.id, { title: title.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleDescSave = () => {
        if (!card) return;
        if (description !== card.description) {
            updateCard(card.id, { description });
        }
        setIsEditingDesc(false);
    };

    const handleDueDateChange = (date: dayjs.Dayjs | null) => {
        if (!card) return;
        updateCard(card.id, {
            due_date: date ? date.toISOString() : undefined,
        });
        setDueDateOpen(false);
        if (currentBoard?.id) {
            fetchBoard(currentBoard.id);
        }
    };

    const handleCompletedChange = (checked: boolean) => {
        if (!card) return;
        updateCard(card.id, { is_completed: checked });
    };

    const handleDelete = () => {
        if (!card) return;
        Modal.confirm({
            title: 'Delete card?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: () => {
                deleteCard(card.id);
                onClose();
            },
        });
    };

    const handleAddComment = async () => {
        if (!card || !newComment.trim()) return;
        try {
            const response = await api.post(`/cards/${card.id}/comments`, {
                content: newComment.trim(),
            });
            setComments([response.data.data, ...comments]);
            setNewComment('');
        } catch (error) {
            message.error('Failed to add comment');
        }
    };

    const handleToggleLabel = async (labelId: string) => {
        if (!card) return;
        const hasLabel = card.labels?.some((cl) => cl.label_id === labelId);
        try {
            if (hasLabel) {
                await api.delete(`/cards/${card.id}/labels/${labelId}`);
            } else {
                await api.post(`/cards/${card.id}/labels`, { label_id: labelId });
            }
            if (currentBoard?.id) {
                fetchBoard(currentBoard.id);
            }
        } catch (error) {
            message.error('Failed to update label');
        }
    };

    const handleCreateLabel = async () => {
        if (!currentBoard?.id) return;
        try {
            await api.post(`/boards/${currentBoard.id}/labels`, {
                name: newLabelName || undefined,
                color: newLabelColor,
            });
            setNewLabelName('');
            fetchBoardLabels();
        } catch (error) {
            message.error('Failed to create label');
        }
    };

    const handleToggleMember = async (userId: string) => {
        if (!card) return;
        const hasMember = card.members?.some((cm) => cm.user_id === userId);
        try {
            if (hasMember) {
                await api.delete(`/cards/${card.id}/members/${userId}`);
            } else {
                await api.post(`/cards/${card.id}/members`, { user_id: userId });
            }
            if (currentBoard?.id) {
                fetchBoard(currentBoard.id);
            }
        } catch (error) {
            message.error('Failed to update member');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!card) return null;

    // Popover content for Members
    const membersContent = (
        <div style={{ width: 250 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Members</Text>
            <AntList
                size="small"
                dataSource={workspaceMembers}
                renderItem={(member) => {
                    const isAssigned = card.members?.some((cm) => cm.user_id === member.id);
                    return (
                        <AntList.Item
                            style={{ cursor: 'pointer', padding: '8px 0' }}
                            onClick={() => handleToggleMember(member.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                <Avatar size="small" style={{ backgroundColor: '#0052cc' }}>
                                    {member.full_name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <span style={{ flex: 1 }}>{member.full_name}</span>
                                {isAssigned && <CheckOutlined style={{ color: '#52c41a' }} />}
                            </div>
                        </AntList.Item>
                    );
                }}
            />
        </div>
    );

    // Popover content for Labels
    const labelsContent = (
        <div style={{ width: 280 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Labels</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {boardLabels.map((label) => {
                    const isSelected = card.labels?.some((cl) => cl.label_id === label.id);
                    return (
                        <div
                            key={label.id}
                            onClick={() => handleToggleLabel(label.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                borderRadius: 4,
                                backgroundColor: label.color,
                                cursor: 'pointer',
                                color: 'white',
                            }}
                        >
                            <span style={{ flex: 1 }}>{label.name || ''}</span>
                            {isSelected && <CheckOutlined />}
                        </div>
                    );
                })}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Create a new label</Text>
            <Input
                placeholder="Label name (optional)"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                size="small"
                style={{ marginTop: 4, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {LABEL_COLORS.map((color) => (
                    <div
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: color,
                            cursor: 'pointer',
                            border: newLabelColor === color ? '2px solid #000' : 'none',
                        }}
                    />
                ))}
            </div>
            <Button type="primary" size="small" block onClick={handleCreateLabel}>
                Create Label
            </Button>
        </div>
    );

    // Popover content for Due Date
    const dueDateContent = (
        <div style={{ width: 280 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Due Date</Text>
            <DatePicker
                showTime
                value={card.due_date ? dayjs(card.due_date) : null}
                onChange={handleDueDateChange}
                style={{ width: '100%' }}
            />
            {card.due_date && (
                <Button
                    type="link"
                    danger
                    size="small"
                    style={{ marginTop: 8, padding: 0 }}
                    onClick={() => handleDueDateChange(null)}
                >
                    Remove due date
                </Button>
            )}
        </div>
    );

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={640}
            closable={false}
            styles={{
                body: { padding: 0 },
                header: { display: 'none' },
            }}
            maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-primary)',
                    zIndex: 10,
                }}
            >
                <div style={{ flex: 1, paddingRight: 16 }}>
                    {isEditingTitle ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onPressEnter={handleTitleSave}
                            autoFocus
                            style={{ fontSize: 20, fontWeight: 600 }}
                        />
                    ) : (
                        <Title
                            level={4}
                            style={{ margin: 0, cursor: 'pointer' }}
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {card.title}
                        </Title>
                    )}
                </div>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    style={{ marginTop: -4 }}
                />
            </div>

            {/* Content */}
            <div style={{ padding: 24, display: 'flex', gap: 24 }}>
                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    {/* Labels */}
                    {card.labels && card.labels.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Labels
                            </Text>
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {card.labels.map((cl) => (
                                    <div
                                        key={cl.id}
                                        style={{
                                            backgroundColor: cl.label?.color,
                                            padding: '4px 12px',
                                            borderRadius: 4,
                                            color: 'white',
                                            fontSize: 12,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {cl.label?.name || ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Members */}
                    {card.members && card.members.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Members
                            </Text>
                            <Avatar.Group style={{ marginTop: 4 }}>
                                {card.members.map((cm) => (
                                    <Tooltip key={cm.id} title={cm.user?.full_name}>
                                        <Avatar style={{ backgroundColor: '#0052cc' }}>
                                            {cm.user?.full_name?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                            </Avatar.Group>
                        </div>
                    )}

                    {/* Due Date */}
                    {card.due_date && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Due date
                            </Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <Checkbox
                                    checked={card.is_completed}
                                    onChange={(e) => handleCompletedChange(e.target.checked)}
                                />
                                <Tag
                                    color={
                                        card.is_completed
                                            ? 'success'
                                            : new Date(card.due_date) < new Date()
                                                ? 'error'
                                                : 'default'
                                    }
                                >
                                    {formatDate(card.due_date)}
                                </Tag>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlignLeftOutlined />
                                <Text strong>Description</Text>
                            </div>
                            {!isEditingDesc && description && (
                                <Button
                                    type="text"
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
                                <RichTextEditor
                                    content={description}
                                    onChange={setDescription}
                                    editable={true}
                                    placeholder="Add a more detailed description..."
                                />
                                <div style={{ marginTop: 8 }}>
                                    <Button type="primary" size="small" onClick={handleDescSave}>
                                        Save
                                    </Button>
                                    <Button
                                        size="small"
                                        style={{ marginLeft: 8 }}
                                        onClick={() => {
                                            setDescription(card.description || '');
                                            setIsEditingDesc(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => !description && setIsEditingDesc(true)}
                                style={{
                                    padding: description ? 0 : 12,
                                    background: description ? 'transparent' : 'var(--bg-tertiary)',
                                    borderRadius: 8,
                                    cursor: description ? 'default' : 'pointer',
                                    minHeight: description ? 'auto' : 60,
                                }}
                            >
                                {description ? (
                                    <RichTextEditor
                                        content={description}
                                        editable={false}
                                    />
                                ) : (
                                    <Text type="secondary">Add a more detailed description...</Text>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Comments */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <CommentOutlined />
                            <Text strong>Activity</Text>
                        </div>

                        {/* Add Comment */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <Avatar style={{ backgroundColor: '#0052cc' }}>
                                {user?.full_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <TextArea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                />
                                <Button
                                    type="primary"
                                    size="small"
                                    style={{ marginTop: 8 }}
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>

                        {/* Comments List */}
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                style={{ display: 'flex', gap: 12, marginBottom: 16 }}
                            >
                                <Avatar style={{ backgroundColor: '#0052cc' }}>
                                    {comment.user?.full_name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <div style={{ flex: 1 }}>
                                    <div>
                                        <Text strong>{comment.user?.full_name}</Text>
                                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                            {formatDate(comment.created_at)}
                                        </Text>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 4,
                                            padding: '8px 12px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 8,
                                        }}
                                    >
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ width: 160 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Add to card
                    </Text>
                    <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                        <Popover
                            content={membersContent}
                            trigger="click"
                            open={membersOpen}
                            onOpenChange={setMembersOpen}
                            placement="bottomLeft"
                        >
                            <Button icon={<UserOutlined />} block style={{ textAlign: 'left' }}>
                                Members
                            </Button>
                        </Popover>
                        <Popover
                            content={labelsContent}
                            trigger="click"
                            open={labelsOpen}
                            onOpenChange={setLabelsOpen}
                            placement="bottomLeft"
                        >
                            <Button icon={<TagOutlined />} block style={{ textAlign: 'left' }}>
                                Labels
                            </Button>
                        </Popover>
                        <Popover
                            content={dueDateContent}
                            trigger="click"
                            open={dueDateOpen}
                            onOpenChange={setDueDateOpen}
                            placement="bottomLeft"
                        >
                            <Button icon={<ClockCircleOutlined />} block style={{ textAlign: 'left' }}>
                                Due date
                            </Button>
                        </Popover>
                    </Space>

                    <Divider />

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Actions
                    </Text>
                    <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                        <Button
                            icon={<DeleteOutlined />}
                            block
                            danger
                            style={{ textAlign: 'left' }}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </Space>
                </div>
            </div>
        </Drawer>
    );
}
