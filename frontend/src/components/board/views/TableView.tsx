'use client';

import React, { useMemo } from 'react';
import { Table, Tag, Avatar, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TableViewProps {
    onCardClick?: (cardId: string) => void;
}

export default function TableView({ onCardClick }: TableViewProps) {
    const { lists, currentBoard } = useBoardStore();

    // Flatten all cards with list info
    const cards = useMemo(() => {
        const allCards: (Card & { listTitle: string; listId: string })[] = [];
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                allCards.push({
                    ...card,
                    listTitle: list.title,
                    listId: list.id,
                });
            });
        });
        return allCards;
    }, [lists]);

    const columns: ColumnsType<Card & { listTitle: string; listId: string }> = [
        {
            title: 'Card',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            render: (title: string, record) => (
                <Text
                    strong
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCardClick?.(record.id)}
                >
                    {title}
                </Text>
            ),
        },
        {
            title: 'List',
            dataIndex: 'listTitle',
            key: 'list',
            width: 150,
            render: (listTitle: string) => (
                <Tag color="blue">{listTitle}</Tag>
            ),
        },
        {
            title: 'Labels',
            key: 'labels',
            width: 200,
            render: (_, record) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(record.labels || []).slice(0, 3).map((label) => (
                        <Tag
                            key={label.label_id}
                            color={label.label?.color}
                            style={{ margin: 0 }}
                        >
                            {label.label?.name || ''}
                        </Tag>
                    ))}
                    {(record.labels?.length || 0) > 3 && (
                        <Tag>+{(record.labels?.length || 0) - 3}</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Members',
            key: 'members',
            width: 120,
            render: (_, record) => (
                <Avatar.Group maxCount={3} size="small">
                    {(record.members || []).map((member: { user_id: string; user?: { full_name: string; avatar_url?: string } }) => (
                        <Tooltip key={member.user_id} title={member.user?.full_name}>
                            <Avatar
                                src={member.user?.avatar_url}
                                style={{ backgroundColor: '#1890ff' }}
                            >
                                {member.user?.full_name?.[0] || '?'}
                            </Avatar>
                        </Tooltip>
                    ))}
                </Avatar.Group>
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            width: 120,
            sorter: (a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            },
            render: (dueDate: string) => {
                if (!dueDate) return <Text type="secondary">-</Text>;
                const date = dayjs(dueDate);
                const isOverdue = date.isBefore(dayjs(), 'day');
                const isDueSoon = date.isBefore(dayjs().add(2, 'day'), 'day');
                return (
                    <Tag color={isOverdue ? 'red' : isDueSoon ? 'orange' : 'default'}>
                        {date.format('MMM D')}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_, record) => (
                record.is_completed ? (
                    <Tag color="green">Complete</Tag>
                ) : (
                    <Tag>In Progress</Tag>
                )
            ),
        },
    ];

    return (
        <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
            <Table
                dataSource={cards}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 50, showSizeChanger: true }}
                size="small"
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 8,
                }}
                onRow={(record) => ({
                    onClick: () => onCardClick?.(record.id),
                    style: { cursor: 'pointer' },
                })}
            />
        </div>
    );
}
