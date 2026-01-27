'use client';

import React, { useState } from 'react';
import { Input, Button, Typography } from 'antd';
import { CommentOutlined } from '@ant-design/icons';
import { Comment, User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';

const { Text } = Typography;
const { TextArea } = Input;

interface ActivitySectionProps {
    comments: Comment[];
    currentUser: User | null;
    onAddComment: (content: string) => Promise<Comment>;
    isLoading?: boolean;
}

export default function ActivitySection({
    comments,
    currentUser,
    onAddComment,
    isLoading = false,
}: ActivitySectionProps) {
    const [newComment, setNewComment] = useState('');

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
        await onAddComment(newComment.trim());
        setNewComment('');
    };

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
                        onClick={handleSubmit}
                        disabled={!newComment.trim()}
                        loading={isLoading}
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
                    <UserAvatar
                        avatarUrl={comment.user?.avatar_url}
                        name={comment.user?.full_name}
                        size="small"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div>
                            <Text strong style={{ fontSize: 13 }}>
                                {comment.user?.full_name}
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                {formatDate(comment.created_at)}
                            </Text>
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                wordBreak: 'break-word',
                                fontSize: 13,
                            }}
                        >
                            {comment.content}
                        </div>
                    </div>
                </div>
            ))}

            {comments.length === 0 && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    No comments yet
                </Text>
            )}
        </div>
    );
}
