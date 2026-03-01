'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { BoardList as ListType, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import { ScreenHeader } from './MenuShared';
import { useTranslation } from '@/hooks/useLabels';

import { Tabs, Button, Text, Center, Loader, Title, Tooltip, Flex } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowBack, IconInbox, IconTrash } from '@tabler/icons-react';
interface ArchivedScreenProps {
    boardId: string;
    onBack: () => void;
    onCardClick?: (cardId: string) => void;
}

export default function ArchivedScreen({ boardId, onBack, onCardClick }: ArchivedScreenProps) {
    const t = useTranslation();
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
            notifications.show({ title: 'Error', message: t('ERROR_RESTORE_LIST_FAILED'), color: 'red' });
        }
    };

    const handleRestoreCard = async (cardId: string) => {
        try {
            await api.put(`/cards/${cardId}/unarchive`);
            setArchivedCards(prev => prev.filter(c => c.id !== cardId));
            fetchBoard(boardId);
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_RESTORE_CARD_FAILED'), color: 'red' });
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
        /* TODO: implement confirmation dialog */ ({
            title: t('UI_DELETE_CARD_PERMANENTLY'),
            content: `"${cardTitle}" ${t('UI_DELETE_CARD_CONFIRM')}`,
            okText: t('UI_DELETE'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/cards/${cardId}`);
                    setArchivedCards(prev => prev.filter(c => c.id !== cardId));
                } catch (error) {
                    notifications.show({ title: 'Error', message: t('ERROR_DELETE_CARD_FAILED'), color: 'red' });
                }
            },
        });
    };

    const handleDeleteList = (listId: string, listTitle: string) => {
        /* TODO: implement confirmation dialog */ ({
            title: t('UI_DELETE_LIST_PERMANENTLY'),
            content: `"${listTitle}" ${t('UI_DELETE_LIST_CONFIRM')}`,
            okText: t('UI_DELETE'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/lists/${listId}`);
                    setArchivedLists(prev => prev.filter(l => l.id !== listId));
                } catch (error) {
                    notifications.show({ title: 'Error', message: t('ERROR_DELETE_LIST_FAILED'), color: 'red' });
                }
            },
        });
    };

    const tabItems = [
        {
            key: 'cards',
            label: `Cards (${archivedCards.length})`,
            children: loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Loader size="sm" /></div>
            ) : archivedCards.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">{t('UI_NO_ARCHIVED_CARDS')}</Text>
            ) : (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {archivedCards.map((card, index) => (
                        <Flex key={card.id} align="center" justify="space-between" style={{ padding: '6px 0', borderBottom: index < archivedCards.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                                <IconInbox size={14} />
                                <Text
                                    c="blue"
                                    style={{ cursor: 'pointer', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    onClick={() => handleCardClick(card.id)}
                                >
                                    {card.title}
                                </Text>
                            </Flex>
                            <Flex gap={4}>
                                <Tooltip label={t('UI_RESTORE')}>
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        leftSection={<IconArrowBack size={16} />}
                                        onClick={() => handleRestoreCard(card.id)}
                                    />
                                </Tooltip>
                                <Tooltip label={t('UI_DELETE_PERMANENTLY')}>
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        color="red"
                                        leftSection={<IconTrash size={16} />}
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
                <div style={{ textAlign: 'center', padding: 20 }}><Loader size="sm" /></div>
            ) : archivedLists.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">{t('UI_NO_ARCHIVED_LISTS')}</Text>
            ) : (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {archivedLists.map((list, index) => (
                        <Flex key={list.id} align="center" justify="space-between" style={{ padding: '6px 0', borderBottom: index < archivedLists.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                                <IconInbox size={14} />
                                <Text style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'truncate', whiteSpace: 'nowrap' }}>
                                    {list.title}
                                </Text>
                            </Flex>
                            <Flex gap={4}>
                                <Tooltip label={t('UI_RESTORE')}>
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        leftSection={<IconArrowBack size={16} />}
                                        onClick={() => handleRestoreList(list.id)}
                                    />
                                </Tooltip>
                                <Tooltip label={t('UI_DELETE_PERMANENTLY')}>
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        color="red"
                                        leftSection={<IconTrash size={16} />}
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
            <ScreenHeader title={t('UI_ARCHIVED_ITEMS')} onBack={onBack} />
            <div style={{ padding: '0 8px' }}>
                <Tabs
                    value={activeTab}
                    onChange={(val) => setActiveTab(val || 'cards')}
                >
                    <Tabs.List>
                        <Tabs.Tab value="cards">{`Cards (${archivedCards.length})`}</Tabs.Tab>
                        <Tabs.Tab value="lists">{`Lists (${archivedLists.length})`}</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="cards">
                        {tabItems[0].children}
                    </Tabs.Panel>
                    <Tabs.Panel value="lists">
                        {tabItems[1].children}
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    );
}
