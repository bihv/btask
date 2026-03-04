'use client';

import { FilterState } from '@/components/board/BoardFilterPopover';
import { filterCard } from '@/components/board/utils/filterCard';
import DueDateTag from '@/components/common/DueDateTag';
import { useAppToken } from '@/hooks/useAppToken';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import { useMemo, useState } from 'react';

import { Avatar, Badge, Group, Pagination, Table, Text, Tooltip } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';

interface TableViewProps {
    filters?: FilterState;
    onCardClick?: (cardId: string) => void;
}

export default function TableView({ filters, onCardClick }: TableViewProps) {
    const { lists } = useBoardStore();
    const token = useAppToken();
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Flatten all cards with list info and apply filters
    const cards = useMemo(() => {
        const allCards: (Card & { listTitle: string; listId: string })[] = [];
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                if (filters && !filterCard(card, filters)) return;

                allCards.push({
                    ...card,
                    listTitle: list.title,
                    listId: list.id,
                });
            });
        });
        return allCards;
    }, [lists, filters]);

    const paginatedCards = cards.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{
            padding: 16,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            margin: 8,
        }}>
            <Table.ScrollContainer minWidth={800} style={{ flex: 1 }}>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Card</Table.Th>
                            <Table.Th>List</Table.Th>
                            <Table.Th>Labels</Table.Th>
                            <Table.Th>Members</Table.Th>
                            <Table.Th>Due Date</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paginatedCards.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                                    <Text c="dimmed">No cards found</Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            paginatedCards.map((record) => (
                                <Table.Tr key={record.id} onClick={() => onCardClick?.(record.id)} style={{ cursor: 'pointer' }}>
                                    <Table.Td>
                                        <Text fw={700}>
                                            {record.link_url && <IconLink size={16} style={{ marginRight: 6, color: 'var(--text-secondary)' }} />}
                                            {record.link_title || record.title}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td><Badge color="blue">{record.listTitle}</Badge></Table.Td>
                                    <Table.Td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {(record.labels || []).slice(0, 3).map((label) => (
                                                <Badge key={label.label_id} color={label.label?.color} style={{ margin: 0 }}>
                                                    {label.label?.name || ''}
                                                </Badge>
                                            ))}
                                            {(record.labels?.length || 0) > 3 && (
                                                <Badge>+{(record.labels?.length || 0) - 3}</Badge>
                                            )}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Avatar.Group spacing="sm">
                                            {(record.members || []).slice(0, 3).map((member: { user_id: string; user?: { full_name: string; avatar_url?: string } }) => (
                                                <Tooltip key={member.user_id} label={member.user?.full_name}>
                                                    <Avatar src={member.user?.avatar_url || undefined} size="sm" style={{ backgroundColor: token.colorPrimary }}>
                                                        {member.user?.full_name?.[0] || '?'}
                                                    </Avatar>
                                                </Tooltip>
                                            ))}
                                            {(record.members?.length || 0) > 3 && (
                                                <Avatar size="sm">+{(record.members?.length || 0) - 3}</Avatar>
                                            )}
                                        </Avatar.Group>
                                    </Table.Td>
                                    <Table.Td>
                                        {record.due_date ? <DueDateTag dueDate={record.due_date} isCompleted={record.is_completed} /> : <Text c="dimmed">-</Text>}
                                    </Table.Td>
                                    <Table.Td>
                                        {record.is_completed ? <Badge color="green">Complete</Badge> : <Badge>In Progress</Badge>}
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>

            {cards.length > pageSize && (
                <Group justify="flex-end" mt="md">
                    <Pagination value={page} onChange={setPage} total={Math.ceil(cards.length / pageSize)} />
                </Group>
            )}
        </div>
    );
}
