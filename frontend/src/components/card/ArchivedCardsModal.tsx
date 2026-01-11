'use client';

import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Typography, Space, Empty, message, Spin, Avatar } from 'antd';
import { InboxOutlined, UndoOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Card } from '@/types';
import { cardArchiveApi } from '@/lib/api';
import api from '@/lib/api';

const { Text } = Typography;

interface ArchivedCardsModalProps {
    boardId: string;
    open: boolean;
    onClose: () => void;
    onCardRestored?: () => void;
}

export default function ArchivedCardsModal({
    boardId,
    open,
    onClose,
    onCardRestored,
}: ArchivedCardsModalProps) {
    const [archivedCards, setArchivedCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && boardId) {
            loadArchivedCards();
        }
    }, [open, boardId]);

    const loadArchivedCards = async () => {
        setLoading(true);
        try {
            const response = await cardArchiveApi.getArchivedByBoard(boardId);
            setArchivedCards(response.data.data || []);
        } catch (error) {
            message.error('Failed to load archived cards');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (cardId: string) => {
        try {
            await cardArchiveApi.unarchive(cardId);
            message.success('Card restored');
            setArchivedCards(archivedCards.filter(c => c.id !== cardId));
            onCardRestored?.();
        } catch (error) {
            message.error('Failed to restore card');
        }
    };

    const handleDelete = async (cardId: string) => {
        try {
            await api.delete(`/cards/${cardId}`);
            message.success('Card deleted permanently');
            setArchivedCards(archivedCards.filter(c => c.id !== cardId));
        } catch (error) {
            message.error('Failed to delete card');
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <InboxOutlined />
                    <span>Archived Cards</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={500}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin />
                </div>
            ) : archivedCards.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No archived cards"
                />
            ) : (
                <List
                    dataSource={archivedCards}
                    renderItem={(card) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="restore"
                                    type="text"
                                    size="small"
                                    icon={<UndoOutlined />}
                                    onClick={() => handleRestore(card.id)}
                                >
                                    Restore
                                </Button>,
                                <Button
                                    key="delete"
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(card.id)}
                                >
                                    Delete
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    card.cover_image ? (
                                        <Avatar
                                            src={card.cover_image}
                                            shape="square"
                                            size={48}
                                        />
                                    ) : (
                                        <Avatar
                                            shape="square"
                                            size={48}
                                            style={{ backgroundColor: '#f0f0f0' }}
                                        >
                                            <InboxOutlined style={{ color: '#999' }} />
                                        </Avatar>
                                    )
                                }
                                title={
                                    <Link href={`/boards/${boardId}/cards/${card.id}`} style={{ color: 'inherit' }}>
                                        {card.title}
                                    </Link>
                                }
                                description={
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {card.labels && card.labels.length > 0 && (
                                            <span>{card.labels.length} label(s) • </span>
                                        )}
                                        Archived
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
}
