'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
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
    ArrowLeftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card, Comment, Label, User } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useHeader } from '@/providers/HeaderProvider';
import { useCard, useBoardLabels, useWorkspaceMembers, useAddComment } from '@/hooks/useCards';

// Dynamic import to avoid SSR issues with BlockNote
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Title, Text } = Typography;
const { TextArea } = Input;

const LABEL_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

export default function CardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const cardId = params.cardId as string;

    const { updateCard, deleteCard, currentBoard, fetchBoard } = useBoardStore();
    const { user } = useAuthStore();
    const { setHeaderContent } = useHeader();

    // React Query hooks
    const { data: cardData, isLoading: cardLoading, refetch: refetchCard } = useCard(cardId);
    const { data: boardLabels = [], refetch: refetchLabels } = useBoardLabels(boardId);
    const { data: workspaceMembers = [] } = useWorkspaceMembers(currentBoard?.workspace_id || '');
    const addCommentMutation = useAddComment(cardId);

    // Local card state for optimistic updates
    const [card, setCard] = useState<Card | null>(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [newComment, setNewComment] = useState('');

    // Popover states
    const [membersOpen, setMembersOpen] = useState(false);
    const [labelsOpen, setLabelsOpen] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);

    // Data for popovers
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    // Comments from card data
    const comments = card?.comments || [];

    // Fetch board for workspace context
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (!currentBoard || currentBoard.id !== boardId) {
                    await fetchBoard(boardId);
                }
            } catch (error) {
                message.error('Failed to load board');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [boardId, fetchBoard, currentBoard]);

    // Sync card data from React Query
    useEffect(() => {
        if (cardData) {
            setCard(cardData);
            setTitle(cardData.title);
            setDescription(cardData.description || '');
        }
    }, [cardData]);

    const handleBack = () => {
        router.push(`/boards/${boardId}`);
    };

    // Set dynamic header content
    useEffect(() => {
        if (card) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                    />
                    {isEditingTitle ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onPressEnter={handleTitleSave}
                            autoFocus
                            style={{ fontSize: 16, fontWeight: 600, maxWidth: 400 }}
                        />
                    ) : (
                        <Text
                            strong
                            style={{ fontSize: 16, cursor: 'pointer' }}
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {card.title}
                        </Text>
                    )}
                </div>
            );
        }
        
        return () => {
            setHeaderContent(null);
        };
    }, [card, isEditingTitle, title]);

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
        
        // Optimistic update - update local state immediately
        setCard({
            ...card,
            due_date: date ? date.toISOString() : undefined,
        });
        
        // Update on server
        updateCard(card.id, {
            due_date: date ? date.toISOString() : undefined,
        });
        setDueDateOpen(false);
    };

    const handleCompletedChange = (checked: boolean) => {
        if (!card) return;
        
        // Optimistic update
        setCard({
            ...card,
            is_completed: checked,
        });
        
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
                router.push(`/boards/${boardId}`);
            },
        });
    };

    const handleAddComment = async () => {
        if (!card || !newComment.trim()) return;
        try {
            await addCommentMutation.mutateAsync(newComment.trim());
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
            refetchLabels();
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

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
                <Text>Card not found</Text>
                <Button onClick={handleBack}>Back to board</Button>
            </div>
        );
    }

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
        <div
            style={{
                height: 'calc(100vh - 64px)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                overflow: 'hidden',
            }}
        >
            {/* Left Column - Description Only */}
            <div 
                style={{ 
                    flex: 1, 
                    minWidth: 0, 
                    overflowY: 'auto',
                    padding: 24,
                }}
            >
                {/* Description */}
                <div>
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
            </div>

            {/* Right Column - Metadata & Activity */}
            <div 
                style={{ 
                    width: 380, 
                    borderLeft: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                    {/* Members Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Members</Text>
                            <Popover
                                content={membersContent}
                                trigger="click"
                                open={membersOpen}
                                onOpenChange={setMembersOpen}
                                placement="bottomRight"
                            >
                                <Button type="text" size="small" icon={<UserOutlined />} />
                            </Popover>
                        </div>
                        {card.members && card.members.length > 0 ? (
                            <Avatar.Group>
                                {card.members.map((cm) => (
                                    <Tooltip key={cm.id} title={cm.user?.full_name}>
                                        <Avatar size="small" style={{ backgroundColor: '#0052cc' }}>
                                            {cm.user?.full_name?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                            </Avatar.Group>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>No members</Text>
                        )}
                    </div>

                    {/* Labels Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Labels</Text>
                            <Popover
                                content={labelsContent}
                                trigger="click"
                                open={labelsOpen}
                                onOpenChange={setLabelsOpen}
                                placement="bottomRight"
                            >
                                <Button type="text" size="small" icon={<TagOutlined />} />
                            </Popover>
                        </div>
                        {card.labels && card.labels.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {card.labels.map((cl) => (
                                    <div
                                        key={cl.id}
                                        style={{
                                            backgroundColor: cl.label?.color,
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            color: 'white',
                                            fontSize: 12,
                                        }}
                                    >
                                        {cl.label?.name || ''}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>No labels</Text>
                        )}
                    </div>

                    {/* Due Date Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Due date</Text>
                            <Popover
                                content={dueDateContent}
                                trigger="click"
                                open={dueDateOpen}
                                onOpenChange={setDueDateOpen}
                                placement="bottomRight"
                            >
                                <Button type="text" size="small" icon={<ClockCircleOutlined />} />
                            </Popover>
                        </div>
                        {card.due_date ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>No due date</Text>
                        )}
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Activity Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <CommentOutlined />
                            <Text strong>Activity</Text>
                        </div>

                        {/* Add Comment */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <Avatar style={{ backgroundColor: '#0052cc', flexShrink: 0 }} size="small">
                                {user?.full_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1, minWidth: 0 }}>
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
                                <Avatar style={{ backgroundColor: '#0052cc', flexShrink: 0 }} size="small">
                                    {comment.user?.full_name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div>
                                        <Text strong style={{ fontSize: 13 }}>{comment.user?.full_name}</Text>
                                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                            {formatDate(comment.created_at)}
                                        </Text>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 4,
                                            padding: '6px 10px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 6,
                                            wordBreak: 'break-word',
                                            fontSize: 13,
                                        }}
                                    >
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delete Button - Fixed at bottom */}
                <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
                    <Button
                        icon={<DeleteOutlined />}
                        block
                        danger
                        onClick={handleDelete}
                    >
                        Delete Card
                    </Button>
                </div>
            </div>
        </div>
    );
}
