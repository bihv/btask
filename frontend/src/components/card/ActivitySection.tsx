'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button, Typography, Spin } from 'antd';
import { CommentOutlined, EditOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { Comment, User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Text } = Typography;

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
                <CommentOutlined />
                <Text strong>Activity</Text>
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
                        placeholder="Write a comment..."
                        workspaceId={workspaceId}
                        cardId={cardId}
                    />
                    <Button
                        type="primary"
                        size="small"
                        style={{ marginTop: 8 }}
                        onClick={handleSubmit}
                        disabled={isCommentEmpty}
                        loading={isLoading}
                    >
                        Save
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
                                    <Text strong style={{ fontSize: 13 }}>
                                        {comment.user?.full_name}
                                    </Text>
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                        {formatDate(comment.created_at)}
                                        {comment.updated_at !== comment.created_at && (
                                            <span style={{ marginLeft: 4, fontStyle: 'italic' }}>(edited)</span>
                                        )}
                                    </Text>
                                </div>
                                {isOwn && !isEditing && onUpdateComment && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
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
                                            placeholder="Edit comment..."
                                            workspaceId={workspaceId}
                                            cardId={cardId}
                                        />
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<CheckOutlined />}
                                                onClick={handleEditSave}
                                                loading={isSavingEdit}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={handleEditCancel}
                                            >
                                                Cancel
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
                <Text type="secondary" style={{ fontSize: 13 }}>
                    No comments yet
                </Text>
            )}
        </div>
    );
}
