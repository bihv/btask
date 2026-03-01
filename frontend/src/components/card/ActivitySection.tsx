'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Comment, User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';

import { Button, Text, Title, Loader } from '@mantine/core';
import { IconMessage, IconEdit, IconX, IconCheck } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

interface ActivitySectionProps {
    comments: Comment[];
    currentUser: User | null;
    onAddComment: (content: string) => Promise<Comment>;
    onUpdateComment?: (commentId: string, content: string) => Promise<Comment>;
    isLoading?: boolean;
    workspaceId?: string;
    cardId?: string;
}

export default function ActivitySection({
    comments,
    currentUser,
    onAddComment,
    onUpdateComment,
    isLoading = false,
    workspaceId,
    cardId,
}: ActivitySectionProps) {
    const t = useTranslation();
    const [newComment, setNewComment] = useState('');
    const [editorKey, setEditorKey] = useState(0);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        await onAddComment(newComment);
        setNewComment('');
        setEditorKey((k) => k + 1);
    };

    const handleCommentChange = useCallback((content: string) => {
        setNewComment(content);
    }, []);

    const handleEditStart = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingContent(comment.content);
    };

    const handleEditCancel = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    const handleEditSave = async () => {
        if (!editingCommentId || !onUpdateComment) return;
        setIsSavingEdit(true);
        try {
            await onUpdateComment(editingCommentId, editingContent);
            setEditingCommentId(null);
            setEditingContent('');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleEditChange = useCallback((content: string) => {
        setEditingContent(content);
    }, []);

    // Check if BlockNote JSON content is empty
    const isCommentEmpty = !newComment.trim() || (() => {
        try {
            const blocks = JSON.parse(newComment);
            if (!Array.isArray(blocks)) return true;
            return blocks.every(
                (b: Record<string, unknown>) =>
                    b.type === 'paragraph' &&
                    (!b.content || (Array.isArray(b.content) && b.content.length === 0))
            );
        } catch {
            return !newComment.trim();
        }
    })();

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconMessage size={16} />
                <Text fw={700}>{t('UI_ACTIVITY')}</Text>
            </div>

            {/* Add Comment */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }} className="no-print">
                <UserAvatar
                    avatarUrl={currentUser?.avatar_url}
                    name={currentUser?.full_name}
                    size="small"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <RichTextEditor
                        key={editorKey}
                        content=""
                        onChange={handleCommentChange}
                        editable={true}
                        placeholder={t('UI_PLACEHOLDER_COMMENT')}
                        workspaceId={workspaceId}
                        cardId={cardId}
                    />
                    <Button

                        size="sm"
                        style={{ marginTop: 8 }}
                        onClick={handleSubmit}
                        disabled={isCommentEmpty}
                        loading={isLoading}
                    >
                        {t('UI_SAVE')}
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            {comments.map((comment) => {
                const isOwn = currentUser?.id === comment.user_id;
                const isEditing = editingCommentId === comment.id;

                return (
                    <div
                        key={comment.id}
                        style={{ display: 'flex', gap: 12, marginBottom: 16 }}
                    >
                        <UserAvatar
                            avatarUrl={comment.user?.avatar_url}
                            name={comment.user?.full_name}
                            size="small"
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <Text fw={700} style={{ fontSize: 13 }}>
                                        {comment.user?.full_name}
                                    </Text>
                                    <Text c="dimmed" style={{ marginLeft: 8, fontSize: 11 }}>
                                        {formatDate(comment.created_at)}
                                        {comment.updated_at !== comment.created_at && (
                                            <span style={{ marginLeft: 4, fontStyle: 'italic' }}>{t('UI_EDITED')}</span>
                                        )}
                                    </Text>
                                </div>
                                {isOwn && !isEditing && onUpdateComment && (
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        leftSection={<IconEdit size={16} />}
                                        onClick={() => handleEditStart(comment)}
                                        style={{ opacity: 0.6 }}
                                    />
                                )}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                {isEditing ? (
                                    <div>
                                        <RichTextEditor
                                            content={editingContent}
                                            onChange={handleEditChange}
                                            editable={true}
                                            placeholder={t('UI_PLACEHOLDER_EDIT_COMMENT')}
                                            workspaceId={workspaceId}
                                            cardId={cardId}
                                        />
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <Button

                                                size="sm"
                                                leftSection={<IconCheck size={16} />}
                                                onClick={handleEditSave}
                                                loading={isSavingEdit}
                                            >
                                                {t('UI_SAVE')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                leftSection={<IconX size={16} />}
                                                onClick={handleEditCancel}
                                            >
                                                {t('UI_CANCEL')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <RichTextEditor
                                        content={comment.content}
                                        editable={false}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {comments.length === 0 && (
                <Text c="dimmed" style={{ fontSize: 13 }}>
                    {t('UI_NO_COMMENTS')}
                </Text>
            )}
        </div>
    );
}
