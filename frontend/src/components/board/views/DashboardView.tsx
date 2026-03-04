'use client';

import { isDueSoon, isOverdue } from '@/components/common/DueDateTag';
import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import { useBoardStore } from '@/stores/boardStore';
import { Card as CardType } from '@/types';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Avatar, Badge, Card, Center, Progress, SimpleGrid, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck, IconClock } from '@tabler/icons-react';
interface DashboardViewProps {
    onCardClick?: (cardId: string) => void;
}

export default function DashboardView({ onCardClick }: DashboardViewProps) {
    const { lists, currentBoard } = useBoardStore();
    const t = useTranslation();
    const token = useAppToken();

    const stats = useMemo(() => {
        let total = 0;
        let complete = 0;
        let overdue = 0;
        let dueSoon = 0;
        const byList: Record<string, { title: string; count: number; color?: string | null }> = {};
        const byLabel: Record<string, { name: string; color: string; count: number }> = {};
        const byMember: Record<string, { name: string; avatar?: string; count: number }> = {};
        const overdueCards: (CardType & { listTitle: string })[] = [];

        lists.forEach((list) => {
            byList[list.id] = { title: list.title, count: 0, color: list.color };

            (list.cards || []).forEach((card) => {
                total++;
                byList[list.id].count++;

                if (card.is_completed) complete++;

                if (card.due_date) {
                    if (isOverdue(card.due_date) && !card.is_completed) {
                        overdue++;
                        overdueCards.push({ ...card, listTitle: list.title });
                    } else if (isDueSoon(card.due_date) && !card.is_completed) {
                        dueSoon++;
                    }
                }

                (card.labels || []).forEach((label) => {
                    if (label.label) {
                        if (!byLabel[label.label_id]) {
                            byLabel[label.label_id] = { name: label.label.name || '', color: label.label.color, count: 0 };
                        }
                        byLabel[label.label_id].count++;
                    }
                });

                (card.members || []).forEach((member: { user_id: string; user?: { full_name: string; avatar_url?: string } }) => {
                    if (member.user) {
                        if (!byMember[member.user_id]) {
                            byMember[member.user_id] = { name: member.user.full_name, avatar: member.user.avatar_url, count: 0 };
                        }
                        byMember[member.user_id].count++;
                    }
                });
            });
        });

        return {
            total,
            complete,
            overdue,
            dueSoon,
            byList: Object.values(byList).sort((a, b) => b.count - a.count),
            byLabel: Object.values(byLabel).sort((a, b) => b.count - a.count).slice(0, 5),
            byMember: Object.values(byMember).sort((a, b) => b.count - a.count).slice(0, 5),
            overdueCards: overdueCards.slice(0, 5),
        };
    }, [lists]);

    const completionPercent = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

    const cardStyle = {
        borderRadius: 8,
        height: '100%',
    };

    return (
        <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {/* Overview Stats */}
                <div>
                    <Card style={cardStyle}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb={4}>{t('UI_TOTAL_CARDS')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconCircleCheck size={20} style={{ color: token.colorPrimary }} />
                            <Title order={2} style={{ margin: 0 }}>{stats.total}</Title>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card style={cardStyle}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb={4}>{t('UI_COMPLETED')}</Text>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                            <Title order={2} style={{ margin: 0, color: token.colorSuccess }}>{stats.complete}</Title>
                            <Text c="dimmed" size="sm">/ {stats.total}</Text>
                        </div>
                        <Progress value={completionPercent} size="sm" />
                    </Card>
                </div>
                <div>
                    <Card style={cardStyle}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb={4}>{t('UI_OVERDUE')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconAlertCircle size={20} style={{ color: stats.overdue > 0 ? token.colorError : 'var(--text-secondary)' }} />
                            <Title order={2} style={{ margin: 0, color: stats.overdue > 0 ? token.colorError : undefined }}>{stats.overdue}</Title>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card style={cardStyle}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb={4}>{t('UI_DUE_SOON')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconClock size={20} style={{ color: stats.dueSoon > 0 ? token.colorWarning : 'var(--text-secondary)' }} />
                            <Title order={2} style={{ margin: 0, color: stats.dueSoon > 0 ? token.colorWarning : undefined }}>{stats.dueSoon}</Title>
                        </div>
                    </Card>
                </div>

                {/* Cards by List */}
                <div>
                    <Card style={cardStyle}>
                        <Text fw={600} mb="md">{t('UI_CARDS_BY_LIST')}</Text>
                        {stats.byList.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">No data</Text>
                        ) : (
                            stats.byList.map((item) => (
                                <div key={item.title} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text>{item.title}</Text>
                                        <Text fw={700}>{item.count}</Text>
                                    </div>
                                    <Progress
                                        value={stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}
                                        color={item.color || token.colorPrimary}
                                        size="sm"
                                    />
                                </div>
                            ))
                        )}
                    </Card>
                </div>

                {/* Top Labels */}
                <div>
                    <Card style={cardStyle}>
                        <Text fw={600} mb="md">{t('UI_TOP_LABELS')}</Text>
                        {stats.byLabel.length === 0 ? (
                            <Center py="xl"><Text c="dimmed">{t('UI_NO_LABELS_USED')}</Text></Center>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {stats.byLabel.map((item, index) => (
                                    <div
                                        key={item.name}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                        }}
                                    >
                                        <Badge color={item.color}>{item.name}</Badge>
                                        <Text fw={700}>{item.count}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Top Members */}
                <div>
                    <Card style={cardStyle}>
                        <Text fw={600} mb="md">{t('UI_MEMBER_WORKLOAD')}</Text>
                        {stats.byMember.length === 0 ? (
                            <Center py="xl"><Text c="dimmed">{t('UI_NO_MEMBERS_ASSIGNED')}</Text></Center>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {stats.byMember.map((item, index) => (
                                    <div
                                        key={item.name}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar src={item.avatar} />
                                            <Text>{item.name}</Text>
                                        </div>
                                        <Text fw={700}>{item.count} {t('UI_CARDS')}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Overdue Cards */}
                <div>
                    <Card
                        style={cardStyle}
                    >
                        <Text fw={600} mb="md" style={{ color: token.colorError }}>{t('UI_OVERDUE_CARDS')}</Text>
                        {stats.overdueCards.length === 0 ? (
                            <Center py="xl"><Text c="dimmed">{t('UI_NO_OVERDUE_CARDS')}</Text></Center>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {stats.overdueCards.map((card, index) => (
                                    <div
                                        key={card.id}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '8px 0',
                                        }}
                                        onClick={() => onCardClick?.(card.id)}
                                    >
                                        <div style={{ marginBottom: 4 }}>
                                            <Text fw={700}>{card.title}</Text>
                                        </div>
                                        <div>
                                            <Badge color="blue">{card.listTitle}</Badge>
                                            <Badge color="red">Due {dayjs(card.due_date).format('MMM D')}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </SimpleGrid>
        </div>
    );
}
