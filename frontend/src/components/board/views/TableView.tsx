'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, Avatar, Typography, Tooltip } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import { FilterState } from '@/components/board/BoardFilterPopover';
import DueDateTag, { isDueSoon, isDueLater } from '@/components/common/DueDateTag';
import dayjs from 'dayjs';
import { useAppToken } from '@/hooks/useAppToken';

const { Text } = Typography;

interface TableViewProps {
    filters?: FilterState;
    onCardClick?: (cardId: string) => void;
}

export default function TableView({ filters, onCardClick }: TableViewProps) {
    const { lists, currentBoard } = useBoardStore();
    const token = useAppToken();
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 50,
    });

    // Get unique lists for filter
    const listFilters = useMemo(() => {
        return lists.map(list => ({ text: list.title, value: list.id }));
    }, [lists]);

    // Get unique labels for filter
    const labelFilters = useMemo(() => {
        const labelsMap = new Map<string, { text: string; value: string }>();
        lists.forEach(list => {
            (list.cards || []).forEach(card => {
                (card.labels || []).forEach(label => {
                    if (label.label && !labelsMap.has(label.label_id)) {
                        labelsMap.set(label.label_id, {
                            text: label.label.name || '',
                            value: label.label_id,
                        });
                    }
                });
            });
        });
        return Array.from(labelsMap.values());
    }, [lists]);

    // Get unique members for filter
    const memberFilters = useMemo(() => {
        const membersMap = new Map<string, { text: string; value: string }>();
        lists.forEach(list => {
            (list.cards || []).forEach(card => {
                (card.members || []).forEach((member: { user_id: string; user?: { full_name: string } }) => {
                    if (member.user && !membersMap.has(member.user_id)) {
                        membersMap.set(member.user_id, {
                            text: member.user.full_name || '',
                            value: member.user_id,
                        });
                    }
                });
            });
        });
        return Array.from(membersMap.values());
    }, [lists]);

    // Flatten all cards with list info and apply filters
    const cards = useMemo(() => {
        const allCards: (Card & { listTitle: string; listId: string })[] = [];
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                // Apply filters
                if (filters) {
                    // Search filter
                    if (filters.search && !card.title.toLowerCase().includes(filters.search.toLowerCase())) {
                        return;
                    }
                    // Label filter
                    if (filters.labelIds.length > 0 || filters.noLabels) {
                        const cardLabelIds = card.labels?.map(l => l.label_id) || [];
                        const matchesNoLabels = filters.noLabels && cardLabelIds.length === 0;
                        const matchesSpecific = filters.labelIds.length > 0 && filters.labelIds.some(id => cardLabelIds.includes(id));
                        if (!matchesNoLabels && !matchesSpecific) {
                            return;
                        }
                    }
                    // Member filter
                    if (filters.memberIds.length > 0 || filters.noMembers) {
                        const cardMemberIds = card.members?.map(m => m.user_id) || [];
                        const matchesNoMembers = filters.noMembers && cardMemberIds.length === 0;
                        const matchesSpecific = filters.memberIds.length > 0 && filters.memberIds.some(id => cardMemberIds.includes(id));
                        if (!matchesNoMembers && !matchesSpecific) {
                            return;
                        }
                    }
                    // Due date filter
                    if (filters.dueDate) {
                        const now = dayjs();
                        const dueDate = card.due_date ? dayjs(card.due_date) : null;
                        if (filters.dueDate === 'overdue' && (!dueDate || !dueDate.isBefore(now))) {
                            return;
                        }
                        if (filters.dueDate === 'due_soon' && (!card.due_date || !isDueSoon(card.due_date))) {
                            return;
                        }
                        if (filters.dueDate === 'due_later' && (!card.due_date || !isDueLater(card.due_date))) {
                            return;
                        }
                        if (filters.dueDate === 'no_date' && card.due_date) {
                            return;
                        }
                    }
                }

                allCards.push({
                    ...card,
                    listTitle: list.title,
                    listId: list.id,
                });
            });
        });
        return allCards;
    }, [lists, filters]);

    const columns: ColumnsType<Card & { listTitle: string; listId: string }> = [
        {
            title: 'Card',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            sorter: (a, b) => a.title.localeCompare(b.title),
            filters: cards.map(card => ({ text: card.title, value: card.title })),
            filterSearch: true,
            onFilter: (value, record) => record.title.toLowerCase().includes(String(value).toLowerCase()),
            render: (title: string, record) => (
                <Text
                    strong
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCardClick?.(record.id)}
                >
                    {record.link_url && <LinkOutlined style={{ marginRight: 6, color: 'var(--text-secondary)' }} />}
                    {record.link_title || title}
                </Text>
            ),
        },
        {
            title: 'List',
            dataIndex: 'listTitle',
            key: 'list',
            width: 150,
            sorter: (a, b) => a.listTitle.localeCompare(b.listTitle),
            filters: listFilters,
            filterSearch: true,
            onFilter: (value, record) => record.listId === value,
            render: (listTitle: string) => (
                <Tag color="blue">{listTitle}</Tag>
            ),
        },
        {
            title: 'Labels',
            key: 'labels',
            width: 200,
            filters: labelFilters,
            filterSearch: true,
            onFilter: (value, record) => {
                const cardLabelIds = record.labels?.map(l => l.label_id) || [];
                return cardLabelIds.includes(value as string);
            },
            sorter: (a, b) => (a.labels?.length || 0) - (b.labels?.length || 0),
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
            filters: memberFilters,
            filterSearch: true,
            onFilter: (value, record) => {
                const cardMemberIds = record.members?.map(m => m.user_id) || [];
                return cardMemberIds.includes(value as string);
            },
            sorter: (a, b) => (a.members?.length || 0) - (b.members?.length || 0),
            render: (_, record) => (
                <Avatar.Group max={{ count: 3 }} size="small">
                    {(record.members || []).map((member: { user_id: string; user?: { full_name: string; avatar_url?: string } }) => (
                        <Tooltip key={member.user_id} title={member.user?.full_name}>
                            <Avatar
                                src={member.user?.avatar_url || undefined}
                                style={{ backgroundColor: token.colorPrimary }}
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
            width: 140,
            sorter: (a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            },
            filters: [
                { text: 'Overdue', value: 'overdue' },
                { text: 'Due soon', value: 'due_soon' },
                { text: 'Due later', value: 'due_later' },
                { text: 'No date', value: 'no_date' },
            ],
            filterSearch: true,
            onFilter: (value, record) => {
                const now = dayjs();
                const dueDate = record.due_date ? dayjs(record.due_date) : null;
                if (value === 'overdue') return dueDate !== null && dueDate.isBefore(now) && !record.is_completed;
                if (value === 'due_soon') return record.due_date ? isDueSoon(record.due_date) : false;
                if (value === 'due_later') return record.due_date ? isDueLater(record.due_date) : false;
                if (value === 'no_date') return !record.due_date;
                return true;
            },
            render: (dueDate: string, record) => {
                if (!dueDate) return <Text type="secondary">-</Text>;
                return (
                    <DueDateTag
                        dueDate={dueDate}
                        isCompleted={record.is_completed}
                    />
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 120,
            filters: [
                { text: 'Complete', value: 'complete' },
                { text: 'In Progress', value: 'in_progress' },
            ],
            filterSearch: true,
            onFilter: (value, record) => {
                if (value === 'complete') return record.is_completed === true;
                if (value === 'in_progress') return record.is_completed !== true;
                return true;
            },
            sorter: (a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1),
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
        <div className="table-view-container" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .table-view-container .ant-pagination {
                    background: var(--bg-primary);
                    padding: 8px 12px;
                    border-radius: 6px;
                    margin-top: 8px;
                }
            `}</style>
            <Table
                dataSource={cards}
                columns={columns}
                rowKey="id"
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} cards`,
                }}
                onChange={(pag) => setPagination(pag)}
                size="small"
                scroll={{ y: 'calc(100vh - 210px)' }}
                onRow={(record) => ({
                    onClick: () => onCardClick?.(record.id),
                    style: { cursor: 'pointer' },
                })}
            />
        </div>
    );
}
