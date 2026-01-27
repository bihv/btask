'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, Button, Empty, Spin, Typography, Tooltip, App, Flex } from 'antd';
import { UndoOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { BoardList as ListType, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import { ScreenHeader } from './MenuShared';

const { Text, Link } = Typography;

interface ArchivedScreenProps {
    boardId: string;
    onBack: () => void;
    onCardClick?: (cardId: string) => void;
}

export default function ArchivedScreen({ boardId, onBack, onCardClick }: ArchivedScreenProps) {
    const { modal, message } = App.useApp();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('cards');
    const [archivedLists, setArchivedLists] = useState<ListType[]>([]);
    const [archivedCards, setArchivedCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const { fetchBoard } = useBoardStore();

    const loadArchivedItems = async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const [listsRes, cardsRes] = await Promise.all([
                api.get(`/boards/${boardId}/archived-lists`),
                api.get(`/boards/${boardId}/archived-cards`),
            ]);
            setArchivedLists(listsRes.data.data || []);
            setArchivedCards(cardsRes.data.data || []);
        } catch (error) {
            console.error('Failed to load archived items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedItems();
    }, [boardId]);

    const handleRestoreList = async (listId: string) => {
        try {
            await api.put(`/lists/${listId}/unarchive`);
            setArchivedLists(prev => prev.filter(l => l.id !== listId));
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to restore list');
        }
    };

    const handleRestoreCard = async (cardId: string) => {
        try {
            await api.put(`/cards/${cardId}/unarchive`);
            setArchivedCards(prev => prev.filter(c => c.id !== cardId));
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to restore card');
        }
    };

    const handleCardClick = (cardId: string) => {
        if (onCardClick) {
            onCardClick(cardId);
        } else {
            router.push(`/boards/${boardId}/cards/${cardId}`);
        }
    };

    const handleDeleteCard = (cardId: string, cardTitle: string) => {
        modal.confirm({
            title: 'Delete card permanently?',
            content: `"${cardTitle}" will be permanently deleted. This cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/cards/${cardId}`);
                    setArchivedCards(prev => prev.filter(c => c.id !== cardId));
                } catch (error) {
                    message.error('Failed to delete card');
                }
            },
        });
    };

    const handleDeleteList = (listId: string, listTitle: string) => {
        modal.confirm({
            title: 'Delete list permanently?',
            content: `"${listTitle}" and all its cards will be permanently deleted. This cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/lists/${listId}`);
                    setArchivedLists(prev => prev.filter(l => l.id !== listId));
                } catch (error) {
                    message.error('Failed to delete list');
                }
            },
        });
    };

    const tabItems = [
        {
            key: 'cards',
            label: `Cards (${archivedCards.length})`,
            children: loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin size="small" /></div>
            ) : archivedCards.length === 0 ? (
                <Empty description="No archived cards" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            ) : (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {archivedCards.map((card, index) => (
                        <Flex key={card.id} align="center" justify="space-between" style={{ padding: '6px 0', borderBottom: index < archivedCards.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                                <InboxOutlined style={{ fontSize: 14, color: '#999', flexShrink: 0 }} />
                                <Link
                                    onClick={() => handleCardClick(card.id)}
                                    style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                    {card.title}
                                </Link>
                            </Flex>
                            <Flex gap={4}>
                                <Tooltip title="Restore">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<UndoOutlined />}
                                        onClick={() => handleRestoreCard(card.id)}
                                    />
                                </Tooltip>
                                <Tooltip title="Delete permanently">
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteCard(card.id, card.title)}
                                    />
                                </Tooltip>
                            </Flex>
                        </Flex>
                    ))}
                </div>
            ),
        },
        {
            key: 'lists',
            label: `Lists (${archivedLists.length})`,
            children: loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin size="small" /></div>
            ) : archivedLists.length === 0 ? (
                <Empty description="No archived lists" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            ) : (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {archivedLists.map((list, index) => (
                        <Flex key={list.id} align="center" justify="space-between" style={{ padding: '6px 0', borderBottom: index < archivedLists.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                                <InboxOutlined style={{ fontSize: 14, color: '#999', flexShrink: 0 }} />
                                <Text style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {list.title}
                                </Text>
                            </Flex>
                            <Flex gap={4}>
                                <Tooltip title="Restore">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<UndoOutlined />}
                                        onClick={() => handleRestoreList(list.id)}
                                    />
                                </Tooltip>
                                <Tooltip title="Delete permanently">
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteList(list.id, list.title)}
                                    />
                                </Tooltip>
                            </Flex>
                        </Flex>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title="Archived items" onBack={onBack} />
            <div style={{ padding: '0 8px' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="small"
                />
            </div>
        </div>
    );
}
