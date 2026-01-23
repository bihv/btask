'use client';

import React from 'react';
import { Button, Typography, Tooltip, Popover, Tag, Divider } from 'antd';
import {
    ClockCircleOutlined,
    TagOutlined,
    UserOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { Card, User, CardMember, Label, Comment } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import LabelPicker from './LabelPicker';
import CustomFieldsSection from './CustomFieldsSection';
import ActivitySection from './ActivitySection';
import CardActionsFooter from './CardActionsFooter';

const { Text } = Typography;

interface CardSidebarProps {
    card: Card;
    cardId: string;
    boardId: string;
    currentUser: User | null;
    workspaceMembers: User[];
    boardLabels: Label[];
    comments: Comment[];
    isAddingComment: boolean;
    labelsOpen: boolean;
    onLabelsOpenChange: (open: boolean) => void;
    onMembersClick: () => void;
    onDueDateClick: () => void;
    onCoverClick: () => void;
    onLabelToggle: (labelId: string) => void;
    onLabelsRefresh: () => void;
    onCardRefresh: () => void;
    onAddComment: (content: string) => Promise<Comment>;
    onArchiveChange: (isArchived: boolean) => void;
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function CardSidebar({
    card,
    cardId,
    boardId,
    currentUser,
    workspaceMembers,
    boardLabels,
    comments,
    isAddingComment,
    labelsOpen,
    onLabelsOpenChange,
    onMembersClick,
    onDueDateClick,
    onCoverClick,
    onLabelToggle,
    onLabelsRefresh,
    onCardRefresh,
    onAddComment,
    onArchiveChange,
}: CardSidebarProps) {
    const labelsContent = (
        <LabelPicker
            boardId={boardId}
            labels={boardLabels}
            selectedLabelIds={card.labels?.map((cl) => cl.label_id) || []}
            onToggle={onLabelToggle}
            onRefresh={onLabelsRefresh}
            onCardRefresh={onCardRefresh}
        />
    );

    return (
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
                    <div
                        style={{ cursor: 'pointer' }}
                        onClick={onMembersClick}
                    >
                        {card.members && card.members.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {card.members.map((cm) => (
                                    <Tooltip key={cm.id} title={cm.user?.full_name}>
                                        <div style={{ marginLeft: -4 }}>
                                            <UserAvatar
                                                avatarUrl={cm.user?.avatar_url}
                                                name={cm.user?.full_name}
                                                size="small"
                                            />
                                        </div>
                                    </Tooltip>
                                ))}
                                <Button type="text" size="small" icon={<span style={{ fontSize: 16 }}>+</span>} />
                            </div>
                        ) : (
                            <Button type="dashed" size="small" icon={<span>+</span>}>
                                Add member
                            </Button>
                        )}
                    </div>
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
                        onOpenChange={onLabelsOpenChange}
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
                    <div
                        style={{ cursor: 'pointer' }}
                        onClick={onDueDateClick}
                    >
                        {card.due_date ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tag
                                    color={
                                        card.is_completed
                                            ? 'success'
                                            : new Date(card.due_date) < new Date()
                                                ? 'error'
                                                : 'default'
                                    }
                                >
                                    {card.is_completed && '✓ '}{formatDate(card.due_date)}
                                </Tag>
                            </div>
                        ) : (
                            <Button type="dashed" size="small" icon={<span>+</span>}>
                                Add due date
                            </Button>
                        )}
                    </div>
                </div>

                {/* Custom Fields Section */}
                <CustomFieldsSection cardId={cardId} boardId={boardId} />

                {/* Cover Image Section */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Cover</Text>
                    </div>
                    <Button
                        type="dashed"
                        block
                        icon={<PictureOutlined />}
                        onClick={onCoverClick}
                    >
                        {card.cover_image ? 'Change Cover' : 'Set Cover'}
                    </Button>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Activity Section */}
                <ActivitySection
                    comments={comments}
                    currentUser={currentUser}
                    onAddComment={onAddComment}
                    isLoading={isAddingComment}
                />
            </div>

            {/* Actions - Fixed at bottom */}
            <CardActionsFooter
                cardId={cardId}
                cardTitle={card?.title || ''}
                boardId={boardId}
                cardData={card || undefined}
                isArchived={card?.is_archived || false}
                onArchiveChange={onArchiveChange}
            />
        </div>
    );
}
