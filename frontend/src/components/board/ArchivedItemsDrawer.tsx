'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer, Tabs, List, Button, Empty, Spin, Typography, App } from 'antd';
import { UndoOutlined, InboxOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { List as ListType, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';

const { Text, Link } = Typography;

interface ArchivedItemsDrawerProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
}

export default function ArchivedItemsDrawer({ open, onClose, boardId }: ArchivedItemsDrawerProps) {
    const router = useRouter();
    const { message } = App.useApp();
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
        if (open) {
            loadArchivedItems();
        }
    }, [open, boardId]);

    const handleRestoreList = async (listId: string) => {
        try {
            await api.put(`/lists/${listId}/unarchive`);
            message.success('List restored');
            setArchivedLists(prev => prev.filter(l => l.id !== listId));
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to restore list');
        }
    };

    const handleRestoreCard = async (cardId: string) => {
        try {
            await api.put(`/cards/${cardId}/unarchive`);
            message.success('Card restored');
            setArchivedCards(prev => prev.filter(c => c.id !== cardId));
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to restore card');
        }
    };

    const handleCardClick = (cardId: string) => {
        onClose();
        router.push(`/boards/${boardId}/cards/${cardId}`);
    };

    const tabItems = [
        {
            key: 'cards',
            label: `Cards (${archivedCards.length})`,
            children: loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : archivedCards.length === 0 ? (
                <Empty description="No archived cards" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <List
                    dataSource={archivedCards}
                    renderItem={(card) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="restore"
                                    type="text"
                                    icon={<UndoOutlined />}
                                    onClick={() => handleRestoreCard(card.id)}
                                >
                                    Restore
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<InboxOutlined style={{ fontSize: 20, color: '#999' }} />}
                                title={
                                    <Link onClick={() => handleCardClick(card.id)}>
                                        {card.title}
                                    </Link>
                                }
                                description={card.description ? (
                                    <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                                        {card.description}
                                    </Text>
                                ) : null}
                            />
                        </List.Item>
                    )}
                />
            ),
        },
        {
            key: 'lists',
            label: `Lists (${archivedLists.length})`,
            children: loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : archivedLists.length === 0 ? (
                <Empty description="No archived lists" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <List
                    dataSource={archivedLists}
                    renderItem={(list) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="restore"
                                    type="text"
                                    icon={<UndoOutlined />}
                                    onClick={() => handleRestoreList(list.id)}
                                >
                                    Restore
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<InboxOutlined style={{ fontSize: 20, color: '#999' }} />}
                                title={<Text>{list.title}</Text>}
                            />
                        </List.Item>
                    )}
                />
            ),
        },
    ];

    return (
        <Drawer
            title="Archived items"
            placement="right"
            open={open}
            onClose={onClose}
            width={400}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
        </Drawer>
    );
}

