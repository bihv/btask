'use client';

import React, { useState } from 'react';
import { Button, Typography, Tooltip, Input } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { Card, User, CardMember, Label, Comment } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import CardActionsFooter from './CardActionsFooter';
import ActivitySection from './ActivitySection';

const { Text } = Typography;
const { TextArea } = Input;

interface CardSidebarProps {
    card: Card;
    cardId: string;
    boardId: string;
    currentUser: User | null;
    workspaceMembers: User[];
    boardLabels: Label[];
    comments: Comment[];
    isAddingComment: boolean;
    onMembersClick: () => void;
    onLabelsClick: () => void;
    onDueDateClick: () => void;
    onCoverClick: () => void;
    onLabelsRefresh: () => void;
    onCardRefresh: () => void;
    onAddComment: (content: string) => Promise<Comment>;
    onArchiveChange: (isArchived: boolean) => void;
}

export default function CardSidebar({
    card,
    cardId,
    boardId,
    currentUser,
    workspaceMembers,
    boardLabels,
    comments,
    isAddingComment,
    onMembersClick,
    onLabelsClick,
    onDueDateClick,
    onCoverClick,
    onLabelsRefresh,
    onCardRefresh,
    onAddComment,
    onArchiveChange,
}: CardSidebarProps) {
    return (
        <div
            style={{
                width: 380,
                borderLeft: '1px solid var(--border-color)',
                padding: 16,
                overflowY: 'auto',
                height: '100%',
            }}
            className="card-sidebar"
        >
            <style jsx>{`
                @media (max-width: 768px) {
                    .card-sidebar {
                        width: 100% !important;
                        border-left: none !important;
                        border-top: 1px solid var(--border-color) !important;
                        height: auto !important;
                        overflow-y: visible !important;
                    }
                }
            `}</style>
            <div>
                {/* Comments and Activity Section */}
                <ActivitySection
                    comments={comments}
                    currentUser={currentUser}
                    onAddComment={onAddComment}
                    isLoading={isAddingComment}
                />

                {/* Card Actions */}
                <div style={{ marginTop: 24 }}>
                    <CardActionsFooter
                        cardId={cardId}
                        cardTitle={card?.title || ''}
                        boardId={boardId}
                        cardData={card || undefined}
                        isArchived={card?.is_archived || false}
                        onArchiveChange={onArchiveChange}
                    />
                </div>
            </div>
        </div>
    );
}
