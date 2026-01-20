'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Badge, Popover, Typography, Tag, Empty, Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { CalendarMode } from 'antd/es/calendar/generateCalendar';
import dayjs from 'dayjs';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import { FilterState } from '@/components/board/BoardFilterPopover';
import DueDateTag, { isDueSoon, isDueLater } from '@/components/common/DueDateTag';

const { Text } = Typography;

interface CalendarViewProps {
    filters?: FilterState;
    onCardClick?: (cardId: string) => void;
}

// Filter helper function
const filterCard = (card: Card, filters: FilterState | undefined): boolean => {
    if (!filters) return true;
    
    // Search filter
    if (filters.search && !card.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
    }
    // Label filter
    if (filters.labelIds.length > 0) {
        const cardLabelIds = card.labels?.map(l => l.label_id) || [];
        if (!filters.labelIds.some(id => cardLabelIds.includes(id))) {
            return false;
        }
    }
    // Member filter
    if (filters.memberIds.length > 0) {
        const cardMemberIds = card.members?.map(m => m.user_id) || [];
        if (!filters.memberIds.some(id => cardMemberIds.includes(id))) {
            return false;
        }
    }
    if (filters.dueDate) {
        const now = dayjs();
        const dueDate = card.due_date ? dayjs(card.due_date) : null;
        if (filters.dueDate === 'overdue' && (!dueDate || !dueDate.isBefore(now))) {
            return false;
        }
        if (filters.dueDate === 'due_soon' && (!card.due_date || !isDueSoon(card.due_date))) {
            return false;
        }
        if (filters.dueDate === 'due_later' && (!card.due_date || !isDueLater(card.due_date))) {
            return false;
        }
        if (filters.dueDate === 'no_date' && card.due_date) {
            return false;
        }
    }
    return true;
};

export default function CalendarView({ filters, onCardClick }: CalendarViewProps) {
    const { lists } = useBoardStore();
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
    const [panelDate, setPanelDate] = useState<Dayjs>(dayjs());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Get all cards with due dates (filtered)
    const cardsByDate = useMemo(() => {
        const map: Record<string, (Card & { listTitle: string; listColor?: string })[]> = {};
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                if (card.due_date && filterCard(card, filters)) {
                    const dateKey = dayjs(card.due_date).format('YYYY-MM-DD');
                    if (!map[dateKey]) map[dateKey] = [];
                    map[dateKey].push({ ...card, listTitle: list.title, listColor: list.color });
                }
            });
        });
        return map;
    }, [lists, filters]);

    // Get cards for a specific month
    const getCardsForMonth = (date: Dayjs) => {
        const monthKey = date.format('YYYY-MM');
        const cards: (Card & { listTitle: string; listColor?: string })[] = [];
        Object.keys(cardsByDate).forEach((dateKey) => {
            if (dateKey.startsWith(monthKey)) {
                cards.push(...cardsByDate[dateKey]);
            }
        });
        return cards.sort((a, b) => 
            dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf()
        );
    };

    const dateCellRender = (value: Dayjs) => {
        const dateKey = value.format('YYYY-MM-DD');
        const cards = cardsByDate[dateKey] || [];
        
        if (cards.length === 0) return null;

        const isOverdue = value.isBefore(dayjs(), 'day');
        
        return (
            <Popover
                content={
                    <div style={{ maxHeight: 200, overflow: 'auto', minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                style={{
                                    cursor: 'pointer',
                                    padding: '4px 0',
                                }}
                                onClick={() => onCardClick?.(card.id)}
                            >
                                <div>
                                    <Text strong style={{ fontSize: 12 }}>{card.title}</Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        <Tag 
                                            style={{ 
                                                fontSize: 10, 
                                                backgroundColor: card.listColor || undefined,
                                                color: card.listColor ? '#fff' : undefined,
                                                border: 'none',
                                            }}
                                        >
                                            {card.listTitle}
                                        </Tag>
                                        {card.is_completed && <Tag color="green" style={{ fontSize: 10 }}>Done</Tag>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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

    const monthCellRender = (value: Dayjs) => {
        const cards = getCardsForMonth(value);
        
        if (cards.length === 0) return null;

        const now = dayjs();
        const overdue = cards.filter(card => 
            card.due_date && dayjs(card.due_date).isBefore(now, 'day') && !card.is_completed
        ).length;
        const completed = cards.filter(card => card.is_completed).length;
        const pending = cards.length - overdue - completed;
        
        return (
            <div style={{ 
                position: 'absolute', 
                bottom: 4, 
                right: 4,
                display: 'flex',
                gap: 2,
            }}>
                {overdue > 0 && (
                    <Tooltip title={`${overdue} overdue`}>
                        <Badge
                            count={overdue}
                            style={{ backgroundColor: '#ff4d4f' }}
                        />
                    </Tooltip>
                )}
                {pending > 0 && (
                    <Tooltip title={`${pending} pending`}>
                        <Badge
                            count={pending}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                    </Tooltip>
                )}
                {completed > 0 && (
                    <Tooltip title={`${completed} completed`}>
                        <Badge
                            count={completed}
                            style={{ backgroundColor: '#52c41a' }}
                        />
                    </Tooltip>
                )}
            </div>
        );
    };

    // Get cards to display in sidebar based on mode
    const displayCards = useMemo(() => {
        if (calendarMode === 'year' && panelDate) {
            // In year mode, show cards for the selected month
            return getCardsForMonth(panelDate);
        } else if (selectedDate) {
            // In month mode, show cards for the selected date
            return cardsByDate[selectedDate.format('YYYY-MM-DD')] || [];
        }
        return [];
    }, [calendarMode, panelDate, selectedDate, cardsByDate]);

    const sidebarTitle = useMemo(() => {
        if (calendarMode === 'year' && panelDate) {
            return panelDate.format('MMMM YYYY');
        } else if (selectedDate) {
            return selectedDate.format('MMMM D, YYYY');
        }
        return '';
    }, [calendarMode, panelDate, selectedDate]);

    const handleSelect = (date: Dayjs, selectInfo: { source: 'year' | 'month' | 'date' | 'customize' }) => {
        // Only update selection when actually clicking on a date/month cell
        // Ignore auto-selection from panel navigation
        if (selectInfo.source === 'date') {
            // Clicked on a specific date in month mode
            setSelectedDate(date);
            setSidebarOpen(true);
        } else if (selectInfo.source === 'month') {
            // Clicked on a month in year mode
            setPanelDate(date);
            setSidebarOpen(true);
        }
        // Ignore 'year' and 'customize' sources (navigation actions)
    };

    const handlePanelChange = (date: Dayjs, mode: CalendarMode) => {
        setPanelDate(date);
        setCalendarMode(mode);
    };

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
                borderRadius: 8,
                padding: 16,
                background: 'var(--ant-color-bg-container)',
            }}>
                <Calendar
                    cellRender={(current, info) => {
                        if (info.type === 'date') return dateCellRender(current);
                        if (info.type === 'month') return monthCellRender(current);
                        return info.originNode;
                    }}
                    onSelect={handleSelect}
                    onPanelChange={handlePanelChange}
                />
            </div>
            
            {sidebarOpen && (
                <div style={{
                    width: 300,
                    borderRadius: 8,
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100%',
                    overflow: 'hidden',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
                        <Text strong>
                            {sidebarTitle}
                        </Text>
                        <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => setSidebarOpen(false)}
                        />
                    </div>
                    {displayCards.length === 0 ? (
                        <Empty description="No cards due" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {displayCards.map((card) => (
                                    <div
                                        key={card.id}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '8px 0',
                                        }}
                                        onClick={() => onCardClick?.(card.id)}
                                    >
                                        <div>
                                            <Text strong>{card.title}</Text>
                                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                <Tag 
                                                    style={{ 
                                                        backgroundColor: card.listColor || undefined,
                                                        color: card.listColor ? '#fff' : undefined,
                                                        border: 'none',
                                                    }}
                                                >
                                                    {card.listTitle}
                                                </Tag>
                                                {card.is_completed && <Tag color="green">Done</Tag>}
                                                <DueDateTag
                                                    dueDate={card.due_date!}
                                                    isCompleted={card.is_completed}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
