'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Badge, Popover, List, Typography, Tag, Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';

const { Text } = Typography;

interface CalendarViewProps {
    onCardClick?: (cardId: string) => void;
}

export default function CalendarView({ onCardClick }: CalendarViewProps) {
    const { lists } = useBoardStore();
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

    // Get all cards with due dates
    const cardsByDate = useMemo(() => {
        const map: Record<string, (Card & { listTitle: string })[]> = {};
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                if (card.due_date) {
                    const dateKey = dayjs(card.due_date).format('YYYY-MM-DD');
                    if (!map[dateKey]) map[dateKey] = [];
                    map[dateKey].push({ ...card, listTitle: list.title });
                }
            });
        });
        return map;
    }, [lists]);

    const dateCellRender = (value: Dayjs) => {
        const dateKey = value.format('YYYY-MM-DD');
        const cards = cardsByDate[dateKey] || [];
        
        if (cards.length === 0) return null;

        const isOverdue = value.isBefore(dayjs(), 'day');
        
        return (
            <Popover
                content={
                    <List
                        size="small"
                        dataSource={cards}
                        renderItem={(card) => (
                            <List.Item
                                style={{ cursor: 'pointer', padding: '4px 0' }}
                                onClick={() => onCardClick?.(card.id)}
                            >
                                <div>
                                    <Text strong style={{ fontSize: 12 }}>{card.title}</Text>
                                    <div>
                                        <Tag color="blue" style={{ fontSize: 10 }}>{card.listTitle}</Tag>
                                        {card.is_completed && <Tag color="green" style={{ fontSize: 10 }}>Done</Tag>}
                                    </div>
                                </div>
                            </List.Item>
                        )}
                        style={{ maxHeight: 200, overflow: 'auto', minWidth: 200 }}
                    />
                }
                title={`Cards due ${value.format('MMM D')}`}
                trigger="hover"
            >
                <div style={{ 
                    position: 'absolute', 
                    bottom: 4, 
                    right: 4,
                }}>
                    <Badge
                        count={cards.length}
                        style={{
                            backgroundColor: isOverdue ? '#ff4d4f' : '#1890ff',
                            cursor: 'pointer',
                        }}
                    />
                </div>
            </Popover>
        );
    };

    const selectedCards = selectedDate 
        ? cardsByDate[selectedDate.format('YYYY-MM-DD')] || []
        : [];

    return (
        <div style={{ 
            padding: 16, 
            height: '100%', 
            overflow: 'auto',
            display: 'flex',
            gap: 16,
        }}>
            <div style={{ 
                flex: 1,
                background: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: 8,
                padding: 16,
            }}>
                <Calendar
                    cellRender={(current, info) => {
                        if (info.type === 'date') return dateCellRender(current);
                        return info.originNode;
                    }}
                    onSelect={(date) => setSelectedDate(date)}
                />
            </div>
            
            {selectedDate && (
                <div style={{
                    width: 300,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 8,
                    padding: 16,
                }}>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>
                        {selectedDate.format('MMMM D, YYYY')}
                    </Text>
                    {selectedCards.length === 0 ? (
                        <Empty description="No cards due" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <List
                            size="small"
                            dataSource={selectedCards}
                            renderItem={(card) => (
                                <List.Item
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onCardClick?.(card.id)}
                                >
                                    <div>
                                        <Text strong>{card.title}</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Tag color="blue">{card.listTitle}</Tag>
                                            {card.is_completed && <Tag color="green">Done</Tag>}
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
