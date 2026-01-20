'use client';

import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Progress, Statistic, List, Tag, Avatar, Empty } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import { Card as CardType } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DashboardViewProps {
    onCardClick?: (cardId: string) => void;
}

export default function DashboardView({ onCardClick }: DashboardViewProps) {
    const { lists, currentBoard } = useBoardStore();

    const stats = useMemo(() => {
        let total = 0;
        let complete = 0;
        let overdue = 0;
        let dueSoon = 0;
        const byList: Record<string, { title: string; count: number; color?: string | null }> = {};
        const byLabel: Record<string, { name: string; color: string; count: number }> = {};
        const byMember: Record<string, { name: string; avatar?: string; count: number }> = {};
        const overdueCards: (CardType & { listTitle: string })[] = [];

        const now = dayjs();
        const soonThreshold = now.add(2, 'day');

        lists.forEach((list) => {
            byList[list.id] = { title: list.title, count: 0, color: list.color };
            
            (list.cards || []).forEach((card) => {
                total++;
                byList[list.id].count++;
                
                if (card.is_completed) complete++;
                
                if (card.due_date) {
                    const dueDate = dayjs(card.due_date);
                    if (dueDate.isBefore(now, 'day') && !card.is_completed) {
                        overdue++;
                        overdueCards.push({ ...card, listTitle: list.title });
                    } else if (dueDate.isBefore(soonThreshold, 'day') && !card.is_completed) {
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
                            title="Total Cards"
                            value={stats.total}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Completed"
                            value={stats.complete}
                            suffix={`/ ${stats.total}`}
                            valueStyle={{ color: '#52c41a' }}
                        />
                        <Progress percent={completionPercent} size="small" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Overdue"
                            value={stats.overdue}
                            valueStyle={{ color: stats.overdue > 0 ? '#ff4d4f' : undefined }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Due Soon"
                            value={stats.dueSoon}
                            valueStyle={{ color: stats.dueSoon > 0 ? '#faad14' : undefined }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>

                {/* Cards by List */}
                <Col xs={24} md={12}>
                    <Card title="Cards by List" style={cardStyle}>
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
                    <Card title="Top Labels" style={cardStyle}>
                        {stats.byLabel.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No labels used" />
                        ) : (
                            <List
                                size="small"
                                dataSource={stats.byLabel}
                                renderItem={(item) => (
                                    <List.Item extra={<Text strong>{item.count}</Text>}>
                                        <Tag color={item.color}>{item.name}</Tag>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>

                {/* Top Members */}
                <Col xs={24} md={12}>
                    <Card title="Member Workload" style={cardStyle}>
                        {stats.byMember.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No members assigned" />
                        ) : (
                            <List
                                size="small"
                                dataSource={stats.byMember}
                                renderItem={(item) => (
                                    <List.Item extra={<Text strong>{item.count} cards</Text>}>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar src={item.avatar} icon={<UserOutlined />} />
                                            }
                                            title={item.name}
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>

                {/* Overdue Cards */}
                <Col xs={24} md={12}>
                    <Card
                        title={<Text style={{ color: '#ff4d4f' }}>Overdue Cards</Text>}
                        style={cardStyle}
                    >
                        {stats.overdueCards.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No overdue cards" />
                        ) : (
                            <List
                                size="small"
                                dataSource={stats.overdueCards}
                                renderItem={(card) => (
                                    <List.Item
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => onCardClick?.(card.id)}
                                    >
                                        <List.Item.Meta
                                            title={card.title}
                                            description={
                                                <div>
                                                    <Tag color="blue">{card.listTitle}</Tag>
                                                    <Tag color="red">
                                                        Due {dayjs(card.due_date).format('MMM D')}
                                                    </Tag>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
