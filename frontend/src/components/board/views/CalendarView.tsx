'use client';

import { FilterState } from '@/components/board/BoardFilterPopover';
import { filterCard } from '@/components/board/utils/filterCard';
import { isOverdue } from '@/components/common/DueDateTag';
import { useAppToken } from '@/hooks/useAppToken';
import { useBoardStore } from '@/stores/boardStore';
import { Card } from '@/types';
import { Badge, CloseButton, ScrollArea, Text } from '@mantine/core';
import { IconAlertTriangle, IconCalendarEvent, IconCircleCheck, IconLink } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { Calendar, dayjsLocalizer, type Event, type EventProps, type NavigateAction, type View } from 'react-big-calendar';
import styles from './CalendarView.module.css';

const localizer = dayjsLocalizer(dayjs);

interface CalendarViewProps {
    filters?: FilterState;
    onCardClick?: (cardId: string) => void;
}

interface CardEvent extends Event {
    resource: Card & { listTitle: string; listColor?: string };
}


// Custom event component for rendering cards in week/day views
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

// --- Custom Month Date Header (renders date + count + handles click in content layer) ---
interface MonthDateHeaderProps {
    date: Date;
    label: string;
    eventsMap: Map<string, CardEvent[]>;
    selectedDate: string | null;
    onSelectDate: (date: Date) => void;
}

function MonthDateHeader({ date, label, eventsMap, selectedDate, onSelectDate }: MonthDateHeaderProps) {
    const dateKey = dayjs(date).format('YYYY-MM-DD');
    const isSelected = selectedDate === dateKey;
    const dayEvents = eventsMap.get(dateKey) || [];
    const total = dayEvents.length;

    const countClass = useMemo(() => {
        if (total === 0) return '';
        let overdueCount = 0;
        let completedCount = 0;
        for (const ev of dayEvents) {
            const card = ev.resource;
            if (card.is_completed) completedCount++;
            else if (card.due_date && isOverdue(card.due_date)) overdueCount++;
        }
        if (overdueCount > 0) return styles.countTextOverdue;
        if (completedCount === total) return styles.countTextDone;
        return '';
    }, [dayEvents, total]);

    return (
        <div
            className={`${styles.monthCell} ${isSelected ? styles.monthCellSelected : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelectDate(date);
            }}
        >
            <div className={styles.monthCellHeader}>
                <span className={styles.monthCellDate}>{label}</span>
            </div>
            {total > 0 && (
                <div className={styles.monthCellCount}>
                    {total === 1 ? (
                        <span className={`${styles.countDot} ${countClass}`} />
                    ) : (
                        <span className={`${styles.countText} ${countClass}`}>{total}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Detail Panel for selected date ---
interface DetailPanelProps {
    date: string;
    events: CardEvent[];
    onCardClick?: (cardId: string) => void;
    onClose: () => void;
}

function DetailPanel({ date, events, onCardClick, onClose }: DetailPanelProps) {
    const formatted = dayjs(date).format('dddd, MMMM D');

    return (
        <div className={styles.detailPanel}>
            <div className={styles.detailPanelHeader}>
                <div className={styles.detailPanelHeaderLeft}>
                    <IconCalendarEvent size={18} />
                    <Text fw={700} size="sm">{formatted}</Text>
                </div>
                <CloseButton size="sm" onClick={onClose} />
            </div>
            <Text size="xs" c="dimmed" className={styles.detailPanelCount}>
                {events.length} task{events.length !== 1 ? 's' : ''}
            </Text>
            <ScrollArea className={styles.detailPanelScroll} offsetScrollbars>
                {events.length === 0 ? (
                    <div className={styles.detailPanelEmpty}>
                        <Text size="sm" c="dimmed">No tasks on this day</Text>
                    </div>
                ) : (
                    <div className={styles.detailPanelList}>
                        {events.map((event) => {
                            const card = event.resource;
                            const overdue = card.due_date ? isOverdue(card.due_date) : false;
                            const isLink = !!card.link_url;
                            return (
                                <div
                                    key={card.id}
                                    className={`${styles.detailPanelCard} ${card.is_completed ? styles.detailCardCompleted : ''} ${overdue && !card.is_completed ? styles.detailCardOverdue : ''}`}
                                    onClick={() => onCardClick?.(card.id)}
                                >
                                    <div
                                        className={styles.detailCardColorBar}
                                        style={{ backgroundColor: card.listColor || 'var(--primary-color)' }}
                                    />
                                    <div className={styles.detailCardContent}>
                                        <Text size="sm" fw={600} lineClamp={2} className={styles.detailCardTitle}>
                                            {isLink && <IconLink size={13} className={styles.eventLinkIcon} />}
                                            {card.link_title || card.title}
                                        </Text>
                                        <div className={styles.detailCardMeta}>
                                            <Badge
                                                size="xs"
                                                variant="light"
                                                style={{
                                                    backgroundColor: card.listColor ? `${card.listColor}20` : undefined,
                                                    color: card.listColor || undefined,
                                                    border: card.listColor ? `1px solid ${card.listColor}40` : undefined,
                                                }}
                                            >
                                                {card.listTitle}
                                            </Badge>
                                            {card.is_completed && (
                                                <Badge size="xs" variant="light" color="green" leftSection={<IconCircleCheck size={10} />}>
                                                    Done
                                                </Badge>
                                            )}
                                            {overdue && !card.is_completed && (
                                                <Badge size="xs" variant="light" color="red" leftSection={<IconAlertTriangle size={10} />}>
                                                    Overdue
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}


export default function CalendarView({ filters, onCardClick }: CalendarViewProps) {
    const { lists } = useBoardStore();
    const token = useAppToken();

    // Controlled state for calendar navigation
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<View>('month');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

    // Build a map of date -> events for dot rendering
    const eventsMap = useMemo(() => {
        const map = new Map<string, CardEvent[]>();
        events.forEach((event) => {
            const startDay = dayjs(event.start);
            const endDay = dayjs(event.end);
            // For multi-day events, add to each day
            let current = startDay;
            while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
                const key = current.format('YYYY-MM-DD');
                const existing = map.get(key) || [];
                existing.push(event);
                map.set(key, existing);
                current = current.add(1, 'day');
            }
        });
        return map;
    }, [events]);

    // Events for the selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return eventsMap.get(selectedDate) || [];
    }, [selectedDate, eventsMap]);

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
        // Clear selection when switching views
        if (view !== 'month') {
            setSelectedDate(null);
        }
    }, []);

    // Handle selecting a date in month view (called from MonthDateHeader onClick)
    const handleSelectDate = useCallback((date: Date) => {
        const dateKey = dayjs(date).format('YYYY-MM-DD');
        setSelectedDate(prev => prev === dateKey ? null : dateKey);
    }, []);

    // Prevent default drill-down to day view
    const getDrilldownView = useCallback(() => null, []);

    // Style events based on their status (for week/day views)
    const eventPropGetter = useCallback(
        (event: CardEvent) => {
            const card = event.resource;
            const overdue = card.due_date ? isOverdue(card.due_date) : false;

            let className = styles.eventWrapper;
            if (card.is_completed) {
                className += ` ${styles.eventWrapperCompleted}`;
            }

            return { className, style: {} };
        },
        []
    );

    // Custom components — use custom dateHeader in month view
    const calendarComponents = useMemo(() => {
        if (currentView === 'month') {
            return {
                month: {
                    dateHeader: (props: { date: Date; label: string }) => (
                        <MonthDateHeader
                            date={props.date}
                            label={props.label}
                            eventsMap={eventsMap}
                            selectedDate={selectedDate}
                            onSelectDate={handleSelectDate}
                        />
                    ),
                },
                event: CalendarEvent,
            };
        }
        return { event: CalendarEvent };
    }, [currentView, eventsMap, selectedDate, handleSelectDate]);

    const isMonthView = currentView === 'month';

    return (
        <div className={`${styles.container} ${isMonthView ? styles.containerMonthMode : ''}`}>
            <div className={`${styles.calendarPane} ${selectedDate && isMonthView ? styles.calendarPaneWithPanel : ''}`}>
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
                    getDrilldownView={getDrilldownView}
                    eventPropGetter={eventPropGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    popup
                    selectable={currentView !== 'month'}
                    components={calendarComponents}
                    style={{ height: '100%' }}
                    formats={{
                        monthHeaderFormat: (date: Date) => dayjs(date).format('MMMM YYYY'),
                        dayHeaderFormat: (date: Date) => dayjs(date).format('dddd, MMMM D'),
                        dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                            `${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D, YYYY')}`,
                    }}
                />
            </div>

            {/* Detail Panel — only in month view when a date is selected */}
            {selectedDate && isMonthView && (
                <DetailPanel
                    date={selectedDate}
                    events={selectedDateEvents}
                    onCardClick={onCardClick}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </div>
    );
}
