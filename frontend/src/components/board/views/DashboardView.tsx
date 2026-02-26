'use client';

import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Progress, Statistic, Tag, Avatar, Empty } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import { Card as CardType } from '@/types';
import dayjs from 'dayjs';
import { isOverdue, isDueSoon } from '@/components/common/DueDateTag';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

interface DashboardViewProps {
    onCardClick?: (cardId: string) => void;
}

export default function DashboardView({ onCardClick }: DashboardViewProps) {
    const { lists, currentBoard } = useBoardStore();
    const t = useTranslation();

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
            <Row gutter={[16, 16]}>
                {/* Overview Stats */}
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={t('UI_TOTAL_CARDS')}
                            value={stats.total}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={t('UI_COMPLETED')}
                            value={stats.complete}
                            suffix={`/ ${stats.total}`}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                        <Progress percent={completionPercent} size="small" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={t('UI_OVERDUE')}
                            value={stats.overdue}
                            styles={{ content: { color: stats.overdue > 0 ? '#ff4d4f' : undefined } }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={t('UI_DUE_SOON')}
                            value={stats.dueSoon}
                            styles={{ content: { color: stats.dueSoon > 0 ? '#faad14' : undefined } }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>

                {/* Cards by List */}
                <Col xs={24} md={12}>
                    <Card title={t('UI_CARDS_BY_LIST')} style={cardStyle}>
                        {stats.byList.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            stats.byList.map((item) => (
                                <div key={item.title} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text>{item.title}</Text>
                                        <Text strong>{item.count}</Text>
                                    </div>
                                    <Progress
                                        percent={stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}
                                        strokeColor={item.color || '#1890ff'}
                                        showInfo={false}
                                        size="small"
                                    />
                                </div>
                            ))
                        )}
                    </Card>
                </Col>

                {/* Top Labels */}
                <Col xs={24} md={12}>
                    <Card title={t('UI_TOP_LABELS')} style={cardStyle}>
                        {stats.byLabel.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('UI_NO_LABELS_USED')} />
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
                                        <Tag color={item.color}>{item.name}</Tag>
                                        <Text strong>{item.count}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Top Members */}
                <Col xs={24} md={12}>
                    <Card title={t('UI_MEMBER_WORKLOAD')} style={cardStyle}>
                        {stats.byMember.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('UI_NO_MEMBERS_ASSIGNED')} />
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
                                            <Avatar src={item.avatar} icon={<UserOutlined />} />
                                            <Text>{item.name}</Text>
                                        </div>
                                        <Text strong>{item.count} {t('UI_CARDS')}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Overdue Cards */}
                <Col xs={24} md={12}>
                    <Card
                        title={<Text style={{ color: '#ff4d4f' }}>{t('UI_OVERDUE_CARDS')}</Text>}
                        style={cardStyle}
                    >
                        {stats.overdueCards.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('UI_NO_OVERDUE_CARDS')} />
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
                                            <Text strong>{card.title}</Text>
                                        </div>
                                        <div>
                                            <Tag color="blue">{card.listTitle}</Tag>
                                            <Tag color="red">Due {dayjs(card.due_date).format('MMM D')}</Tag>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
