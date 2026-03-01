'use client';

import React, { useMemo, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, dayjsLocalizer, type Event, type View, type EventProps, type NavigateAction } from 'react-big-calendar';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import { FilterState } from '@/components/board/BoardFilterPopover';
import { isOverdue } from '@/components/common/DueDateTag';
import styles from './CalendarView.module.css';
import { useAppToken } from '@/hooks/useAppToken';
import { Badge, Text } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';

const localizer = dayjsLocalizer(dayjs);

interface CalendarViewProps {
    filters?: FilterState;
    onCardClick?: (cardId: string) => void;
}

interface CardEvent extends Event {
    resource: Card & { listTitle: string; listColor?: string };
}

// Filter helper function
const filterCard = (card: Card, filters: FilterState | undefined): boolean => {
    if (!filters) return true;

    if (filters.search && !card.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
    }
    if (filters.labelIds.length > 0 || filters.noLabels) {
        const cardLabelIds = card.labels?.map(l => l.label_id) || [];
        const matchesNoLabels = filters.noLabels && cardLabelIds.length === 0;
        const matchesSpecific = filters.labelIds.length > 0 && filters.labelIds.some(id => cardLabelIds.includes(id));
        if (!matchesNoLabels && !matchesSpecific) return false;
    }
    if (filters.memberIds.length > 0 || filters.noMembers) {
        const cardMemberIds = card.members?.map(m => m.user_id) || [];
        const matchesNoMembers = filters.noMembers && cardMemberIds.length === 0;
        const matchesSpecific = filters.memberIds.length > 0 && filters.memberIds.some(id => cardMemberIds.includes(id));
        if (!matchesNoMembers && !matchesSpecific) return false;
    }
    if (filters.dueDate) {
        const now = dayjs();
        const dueDate = card.due_date ? dayjs(card.due_date) : null;
        if (filters.dueDate === 'overdue' && (!dueDate || !dueDate.isBefore(now))) return false;
        if (filters.dueDate === 'due_soon' && (!dueDate || !dueDate.isAfter(now) || !dueDate.isBefore(now.add(72, 'hour')))) return false;
        if (filters.dueDate === 'due_later' && (!dueDate || !dueDate.isAfter(now.add(72, 'hour')))) return false;
        if (filters.dueDate === 'no_date' && card.due_date) return false;
    }
    return true;
};

// Custom event component for rendering cards in the calendar
function CalendarEvent({ event }: EventProps<CardEvent>) {
    const card = event.resource;
    const overdue = card.due_date ? isOverdue(card.due_date) : false;
    const isLink = !!card.link_url;

    return (
        <div
            className={`${styles.calendarEvent} ${card.is_completed ? styles.eventCompleted : ''} ${overdue && !card.is_completed ? styles.eventOverdue : ''}`}
            style={{
                borderLeftColor: card.listColor || 'var(--primary-color)',
            }}
        >
            <Text size="xs" fw={600} lineClamp={1} className={styles.eventTitle}>
                {isLink && <IconLink size={12} className={styles.eventLinkIcon} />}
                {card.link_title || card.title}
            </Text>
            <Badge
                size="xs"
                variant="light"
                className={styles.eventBadge}
                style={{
                    backgroundColor: card.listColor ? `${card.listColor}20` : undefined,
                    color: card.listColor || undefined,
                    border: card.listColor ? `1px solid ${card.listColor}40` : undefined,
                }}
            >
                {card.listTitle}
            </Badge>
        </div>
    );
}

export default function CalendarView({ filters, onCardClick }: CalendarViewProps) {
    const { lists } = useBoardStore();
    const token = useAppToken();

    // Controlled state for calendar navigation
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<View>('month');

    // Map cards to react-big-calendar events
    const events: CardEvent[] = useMemo(() => {
        const result: CardEvent[] = [];
        lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
                if (card.due_date && filterCard(card, filters)) {
                    const start = card.start_date
                        ? dayjs(card.start_date).toDate()
                        : dayjs(card.due_date).toDate();
                    const end = dayjs(card.due_date).toDate();

                    result.push({
                        title: card.link_title || card.title,
                        start,
                        end,
                        allDay: true,
                        resource: { ...card, listTitle: list.title, listColor: list.color },
                    });
                }
            });
        });
        return result;
    }, [lists, filters]);

    const handleSelectEvent = useCallback(
        (event: CardEvent) => {
            onCardClick?.(event.resource.id);
        },
        [onCardClick]
    );

    const handleNavigate = useCallback((newDate: Date, view: View, action: NavigateAction) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
    }, []);

    // Style events based on their status
    const eventPropGetter = useCallback(
        (event: CardEvent) => {
            const card = event.resource;
            const overdue = card.due_date ? isOverdue(card.due_date) : false;

            let className = styles.eventWrapper;
            if (card.is_completed) {
                className += ` ${styles.eventWrapperCompleted}`;
            } else if (overdue) {
                className += ` ${styles.eventWrapperOverdue}`;
            }

            return { className, style: {} };
        },
        []
    );

    return (
        <div className={styles.container}>
            <Calendar<CardEvent>
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                view={currentView}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventPropGetter}
                views={['month', 'week', 'day', 'agenda']}
                popup
                selectable={false}
                components={{
                    event: CalendarEvent,
                }}
                style={{ height: '100%' }}
                formats={{
                    monthHeaderFormat: (date: Date) => dayjs(date).format('MMMM YYYY'),
                    dayHeaderFormat: (date: Date) => dayjs(date).format('dddd, MMMM D'),
                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                        `${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D, YYYY')}`,
                }}
            />
        </div>
    );
}

