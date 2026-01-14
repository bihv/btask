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
    Upload,
    App,
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
    InboxOutlined,
    UndoOutlined,
    PictureOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card, Comment, Label, User } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api, { cardArchiveApi, uploadFile } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useHeader } from '@/providers/HeaderProvider';
import { useCard, useBoardLabels, useWorkspaceMembers, useAddComment, useChecklists, useInvalidateChecklists, useAttachments } from '@/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import ChecklistSection from '@/components/card/ChecklistSection';
import AttachmentSection from '@/components/card/AttachmentSection';
import ShareCardPopover from '@/components/card/ShareCardPopover';
import LabelPicker from '@/components/card/LabelPicker';
import CustomFieldsSection from '@/components/card/CustomFieldsSection';


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
    const queryClient = useQueryClient();
    const { modal } = App.useApp();

    // Helper to invalidate board cache after card updates
    const invalidateBoardCache = () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    };

    // React Query hooks
    const { data: cardData, isLoading: cardLoading, refetch: refetchCard } = useCard(cardId);
    const { data: boardLabels = [], refetch: refetchLabels } = useBoardLabels(boardId);
    const { data: workspaceMembers = [] } = useWorkspaceMembers(currentBoard?.workspace_id || '');
    const { data: checklists = [], refetch: refetchChecklists } = useChecklists(cardId);
    const { data: attachments = [], refetch: refetchAttachments } = useAttachments(cardId);

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
    const [coverOpen, setCoverOpen] = useState(false);

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
            // Optimistic update
            setCard({ ...card, title: title.trim() });
            updateCard(card.id, { title: title.trim() });
            invalidateBoardCache();
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
        invalidateBoardCache();
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
        invalidateBoardCache();
    };

    const handleDelete = () => {
        if (!card) return;
        modal.confirm({
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

    const handleArchive = async () => {
        if (!card) return;
        try {
            if (card.is_archived) {
                await cardArchiveApi.unarchive(card.id);
                setCard({ ...card, is_archived: false });
                message.success('Card restored');
            } else {
                await cardArchiveApi.archive(card.id);
                setCard({ ...card, is_archived: true });
                message.success('Card archived');
            }
        } catch (error) {
            message.error('Failed to update card');
        }
    };

    const handleSetCover = async (imageUrl: string) => {
        if (!card) return;
        try {
            // If same cover, remove it
            const newCover = card.cover_image === imageUrl ? '' : imageUrl;
            await api.put(`/cards/${card.id}`, { cover_image: newCover });
            setCard({ ...card, cover_image: newCover });
            setCoverOpen(false);  // Close the popover
            message.success(newCover ? 'Cover image set' : 'Cover image removed');
        } catch (error) {
            message.error('Failed to update cover image');
        }
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

        // Optimistic update
        const label = boardLabels.find((l) => l.id === labelId);
        if (hasLabel) {
            setCard({
                ...card,
                labels: card.labels?.filter((cl) => cl.label_id !== labelId) || [],
            });
        } else if (label) {
            setCard({
                ...card,
                labels: [...(card.labels || []), { id: `temp-${Date.now()}`, label_id: labelId, card_id: card.id, label }],
            });
        }

        try {
            if (hasLabel) {
                await api.delete(`/cards/${card.id}/labels/${labelId}`);
            } else {
                await api.post(`/cards/${card.id}/labels`, { label_id: labelId });
            }
            invalidateBoardCache();
            refetchCard();
        } catch (error) {
            message.error('Failed to update label');
            refetchCard(); // Revert on error
        }
    };



    const handleToggleMember = async (userId: string) => {
        if (!card) return;
        const hasMember = card.members?.some((cm) => cm.user_id === userId);

        // Optimistic update
        const member = workspaceMembers.find((m) => m.id === userId);
        if (hasMember) {
            setCard({
                ...card,
                members: card.members?.filter((cm) => cm.user_id !== userId) || [],
            });
        } else if (member) {
            setCard({
                ...card,
                members: [...(card.members || []), { id: `temp-${Date.now()}`, user_id: userId, card_id: card.id, user: member }],
            });
        }

        try {
            if (hasMember) {
                await api.delete(`/cards/${card.id}/members/${userId}`);
            } else {
                await api.post(`/cards/${card.id}/members`, { user_id: userId });
            }
            invalidateBoardCache();
            refetchCard();
        } catch (error) {
            message.error('Failed to update member');
            refetchCard(); // Revert on error
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

    // Popover content for Labels - using LabelPicker component
    const labelsContent = (
        <LabelPicker
            boardId={boardId}
            labels={boardLabels}
            selectedLabelIds={card.labels?.map((cl) => cl.label_id) || []}
            onToggle={handleToggleLabel}
            onRefresh={refetchLabels}
            onCardRefresh={refetchCard}
        />
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

                {/* Checklists */}
                <div style={{ marginTop: 24 }}>
                    <ChecklistSection
                        cardId={cardId}
                        checklists={checklists}
                        onUpdate={refetchChecklists}
                    />
                </div>

                {/* Attachments */}
                <div style={{ marginTop: 24 }}>
                    <AttachmentSection
                        cardId={cardId}
                        attachments={attachments}
                        onUpdate={refetchAttachments}
                        currentCover={card?.cover_image}
                        onSetCover={handleSetCover}
                    />
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <UserOutlined style={{ color: 'var(--text-secondary)' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>Members</Text>
                        </div>
                        <Popover
                            content={membersContent}
                            trigger="click"
                            open={membersOpen}
                            onOpenChange={setMembersOpen}
                            placement="bottomLeft"
                        >
                            <div style={{ cursor: 'pointer' }}>
                                {card.members && card.members.length > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Avatar.Group>
                                            {card.members.map((cm) => (
                                                <Tooltip key={cm.id} title={cm.user?.full_name}>
                                                    <Avatar size="small" style={{ backgroundColor: '#0052cc' }}>
                                                        {cm.user?.full_name?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                </Tooltip>
                                            ))}
                                        </Avatar.Group>
                                        <Button type="text" size="small" icon={<span style={{ fontSize: 16 }}>+</span>} />
                                    </div>
                                ) : (
                                    <Button type="dashed" size="small" icon={<span>+</span>}>
                                        Add member
                                    </Button>
                                )}
                            </div>
                        </Popover>
                    </div>

                    {/* Labels Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <TagOutlined style={{ color: 'var(--text-secondary)' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>Labels</Text>
                        </div>
                        <Popover
                            content={labelsContent}
                            trigger="click"
                            open={labelsOpen}
                            onOpenChange={setLabelsOpen}
                            placement="bottomLeft"
                        >
                            <div style={{ cursor: 'pointer' }}>
                                {card.labels && card.labels.length > 0 ? (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
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
                                        <Button type="text" size="small" icon={<span style={{ fontSize: 16 }}>+</span>} />
                                    </div>
                                ) : (
                                    <Button type="dashed" size="small" icon={<span>+</span>}>
                                        Add label
                                    </Button>
                                )}
                            </div>
                        </Popover>
                    </div>

                    {/* Due Date Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <ClockCircleOutlined style={{ color: 'var(--text-secondary)' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>Due date</Text>
                        </div>
                        <Popover
                            content={dueDateContent}
                            trigger="click"
                            open={dueDateOpen}
                            onOpenChange={setDueDateOpen}
                            placement="bottomLeft"
                        >
                            <div style={{ cursor: 'pointer' }}>
                                {card.due_date ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Checkbox
                                            checked={card.is_completed}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleCompletedChange(e.target.checked);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
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
                                    <Button type="dashed" size="small" icon={<span>+</span>}>
                                        Add due date
                                    </Button>
                                )}
                            </div>
                        </Popover>
                    </div>

                    {/* Custom Fields Section */}
                    <CustomFieldsSection cardId={cardId} boardId={boardId} />

                    {/* Cover Image Section */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Cover</Text>
                            {card.cover_image && (
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => handleSetCover('')}
                                    title="Remove cover"
                                />
                            )}
                        </div>
                        {card.cover_image && (
                            <div
                                style={{
                                    width: '100%',
                                    height: 120,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    marginBottom: 8,
                                }}
                            >
                                <img
                                    src={card.cover_image}
                                    alt="Cover"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            </div>
                        )}
                        <Popover
                            trigger="click"
                            placement="bottomLeft"
                            open={coverOpen}
                            onOpenChange={setCoverOpen}
                            content={
                                <div style={{ width: 280 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 12 }}>Choose Cover</Text>

                                    {/* Image attachments grid */}
                                    {attachments.filter((a: { file_name: string }) =>
                                        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext =>
                                            a.file_name.toLowerCase().endsWith(ext)
                                        )
                                    ).length > 0 && (
                                            <>
                                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                                                    From attachments
                                                </Text>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                                                    {attachments
                                                        .filter((a: { file_name: string }) =>
                                                            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext =>
                                                                a.file_name.toLowerCase().endsWith(ext)
                                                            )
                                                        )
                                                        .map((a: { file_url: string; file_name: string }) => (
                                                            <div
                                                                key={a.file_url}
                                                                onClick={() => handleSetCover(a.file_url)}
                                                                style={{
                                                                    width: '100%',
                                                                    paddingBottom: '75%',
                                                                    position: 'relative',
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    cursor: 'pointer',
                                                                    border: card.cover_image === a.file_url ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                                                }}
                                                            >
                                                                <img
                                                                    src={a.file_url}
                                                                    alt={a.file_name}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: 0,
                                                                        left: 0,
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                    }}
                                                                />
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </>
                                        )}

                                    {/* Upload new image */}
                                    <Upload
                                        accept="image/*"
                                        showUploadList={false}
                                        beforeUpload={async (file) => {
                                            try {
                                                message.loading('Uploading...', 0);
                                                const url = await uploadFile(file);
                                                message.destroy();
                                                handleSetCover(url);
                                            } catch {
                                                message.destroy();
                                                message.error('Upload failed');
                                            }
                                            return false;
                                        }}
                                    >
                                        <Button type="dashed" block icon={<PictureOutlined />}>
                                            Upload Image
                                        </Button>
                                    </Upload>
                                </div>
                            }
                        >
                            <Button type="dashed" block icon={<PictureOutlined />}>
                                {card.cover_image ? 'Change Cover' : 'Set Cover'}
                            </Button>
                        </Popover>
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

                {/* Actions - Fixed at bottom */}
                <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <ShareCardPopover
                            cardId={cardId}
                            cardTitle={card?.title || ''}
                            boardId={boardId}
                            cardData={card || undefined}
                        />
                        <Button
                            icon={card?.is_archived ? <UndoOutlined /> : <InboxOutlined />}
                            onClick={handleArchive}
                            style={{ flex: 1 }}
                        >
                            {card?.is_archived ? 'Restore' : 'Archive'}
                        </Button>
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={handleDelete}
                            style={{ flex: 1 }}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
