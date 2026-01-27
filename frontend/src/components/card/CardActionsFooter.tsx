'use client';

import React from 'react';
import { Button, App } from 'antd';
import { DeleteOutlined, InboxOutlined, UndoOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ShareCardPopover from './ShareCardPopover';
import { Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import { cardArchiveApi } from '@/lib/api';

interface CardActionsFooterProps {
    cardId: string;
    cardTitle: string;
    boardId: string;
    cardData?: Card;
    isArchived: boolean;
    onArchiveChange: (isArchived: boolean) => void;
}

export default function CardActionsFooter({
    cardId,
    cardTitle,
    boardId,
    cardData,
    isArchived,
    onArchiveChange,
}: CardActionsFooterProps) {
    const router = useRouter();
    const { deleteCard } = useBoardStore();
    const { modal, message } = App.useApp();

    const handleArchive = async () => {
        try {
            if (isArchived) {
                await cardArchiveApi.unarchive(cardId);
                onArchiveChange(false);
            } else {
                await cardArchiveApi.archive(cardId);
                onArchiveChange(true);
            }
        } catch (error) {
            message.error('Failed to update card');
        }
    };

    const handleDelete = () => {
        modal.confirm({
            title: 'Delete card?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: () => {
                deleteCard(cardId);
                router.push(`/boards/${boardId}`);
            },
        });
    };

    return (
        <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ShareCardPopover
                    cardId={cardId}
                    cardTitle={cardTitle}
                    boardId={boardId}
                    cardData={cardData}
                />
                <Button
                    icon={isArchived ? <UndoOutlined /> : <InboxOutlined />}
                    onClick={handleArchive}
                    style={{ flex: 1 }}
                >
                    {isArchived ? 'Restore' : 'Archive'}
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
    );
}
