'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMyCards, useUpdateCard, CardFilters as ApiCardFilters } from '@/hooks/useCards';
import { Card, CardLabel, BoardList, Board, Workspace } from '@/types';
import dayjs from 'dayjs';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Badge, Center, Loader, Button, TextInput, Checkbox, Divider, Indicator, Drawer, MultiSelect } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCreditCard, IconClock, IconCircleCheckFilled, IconFilter, IconCalendar, IconAlertCircle } from '@tabler/icons-react';
// Extended card type with nested list/board/workspace
interface AssignedCard extends Card {
    list?: BoardList & {
        board?: Board & {
            workspace?: Workspace;
        };
    };
}

interface UICardFilters {
    keyword: string;
    status: {
        complete: boolean;
        incomplete: boolean;
    };
    dueDate: {
        noDates: boolean;
        overdue: boolean;
        dueNextDay: boolean;
        dueNextWeek: boolean;
        dueNextMonth: boolean;
    };
    boardIds: string[];
    activity: {
        lastDay: boolean;
        lastWeek: boolean;
        lastMonth: boolean;
        lastYear: boolean;
    };
}

const defaultFilters: UICardFilters = {
    keyword: '',
    status: { complete: false, incomplete: false },
    dueDate: { noDates: false, overdue: false, dueNextDay: false, dueNextWeek: false, dueNextMonth: false },
    boardIds: [],
    activity: { lastDay: false, lastWeek: false, lastMonth: false, lastYear: false },
};

// Convert UI filters to API filters
function toApiFilters(filters: UICardFilters): ApiCardFilters {
    return {
        keyword: filters.keyword || undefined,
        isComplete: filters.status.complete || undefined,
        isIncomplete: filters.status.incomplete || undefined,
        noDueDate: filters.dueDate.noDates || undefined,
        overdue: filters.dueDate.overdue || undefined,
        dueNextDay: filters.dueDate.dueNextDay || undefined,
        dueNextWeek: filters.dueDate.dueNextWeek || undefined,
        dueNextMonth: filters.dueDate.dueNextMonth || undefined,
        boardIds: filters.boardIds.length > 0 ? filters.boardIds : undefined,
        activeLastDay: filters.activity.lastDay || undefined,
        activeLastWeek: filters.activity.lastWeek || undefined,
        activeLastMonth: filters.activity.lastMonth || undefined,
        activeLastYear: filters.activity.lastYear || undefined,
    };
}

export default function CardsTab() {
    const router = useRouter();
    const updateCard = useUpdateCard();
    const t = useTranslation();
    const [filterOpen, setFilterOpen] = useState(false);

    // Separate pending filters (UI state in drawer) from applied filters (sent to API)
    const [appliedFilters, setAppliedFilters] = useState<UICardFilters>(defaultFilters);
    const [pendingFilters, setPendingFilters] = useState<UICardFilters>(defaultFilters);

    // Only use applied filters for API calls - this prevents re-fetching on every checkbox change
    const apiFilters = useMemo(() => toApiFilters(appliedFilters), [appliedFilters]);
    const { data: cards = [], isLoading, refetch } = useMyCards(apiFilters);

    // Get unique boards from all cards (for board filter dropdown)
    const { data: allCards = [] } = useMyCards();
    const uniqueBoards = useMemo(() => {
        const boardMap = new Map<string, { id: string; title: string }>();
        (allCards as AssignedCard[]).forEach(card => {
            const board = card.list?.board;
            if (board && !boardMap.has(board.id)) {
                boardMap.set(board.id, { id: board.id, title: board.title });
            }
        });
        return Array.from(boardMap.values());
    }, [allCards]);

    // Count active filters (show pending count when drawer is open for immediate feedback)
    const activeFilterCount = useMemo(() => {
        const f = appliedFilters;
        let count = 0;
        if (f.keyword) count++;
        if (f.status.complete || f.status.incomplete) count++;
        if (Object.values(f.dueDate).some(v => v)) count++;
        if (f.boardIds.length > 0) count++;
        if (Object.values(f.activity).some(v => v)) count++;
        return count;
    }, [appliedFilters]);

    // Handle opening drawer - sync pending with applied
    const handleOpenFilter = () => {
        setPendingFilters(appliedFilters);
        setFilterOpen(true);
    };

    // Handle closing drawer - apply pending filters
    const handleCloseFilter = () => {
        setAppliedFilters(pendingFilters);
        setFilterOpen(false);
    };

    const handleCardClick = (card: AssignedCard) => {
        const boardId = card.list?.board?.id;
        if (boardId) {
            router.push(`/boards/${boardId}/cards/${card.id}`);
        }
    };

    const handleBoardClick = (e: React.MouseEvent, card: AssignedCard) => {
        e.stopPropagation();
        const boardId = card.list?.board?.id;
        if (boardId) {
            router.push(`/boards/${boardId}`);
        }
    };

    const handleToggleComplete = async (card: AssignedCard, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateCard.mutateAsync({
                id: card.id,
                data: { is_completed: !card.is_completed }
            });
            refetch();
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_CARD'), color: 'red' });
        }
    };

    const handleClearFilters = () => {
        setPendingFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
    };

    const renderDueDate = (card: AssignedCard) => {
        const dueDate = card.due_date;
        if (!dueDate) return <Text style={{ color: 'var(--text-secondary)' }}>-</Text>;

        const date = dayjs(dueDate);
        const now = dayjs();
        const isOverdue = date.isBefore(now) && !card.is_completed;
        const isDueSoon = date.diff(now, 'day') <= 1 && date.isAfter(now) && !card.is_completed;

        let bgColor = 'var(--bg-secondary)';
        let textColor = 'var(--text-primary)';

        if (card.is_completed) {
            bgColor = '#52c41a'; textColor = '#fff';
        } else if (isOverdue) {
            bgColor = '#ff4d4f'; textColor = '#fff';
        } else if (isDueSoon) {
            bgColor = '#faad14'; textColor = '#fff';
        }

        return (
            <Badge
                leftSection={<IconClock size={14} />}
                style={{ backgroundColor: bgColor, color: textColor, border: 'none' }}
            >
                {date.format('MMM D')}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title order={3} style={{ margin: 0 }}>{t('UI_CARDS')}</Title>
                <Indicator label={activeFilterCount > 0 ? activeFilterCount : undefined} size={16} disabled={activeFilterCount === 0}>
                    <Button
                        leftSection={<IconFilter size={16} />}
                        onClick={handleOpenFilter}
                    >
                        {t('UI_FILTER')}
                    </Button>
                </Indicator>
            </div>

            {(cards as AssignedCard[]).length === 0 ? (
                <Center py={48}>
                    <div style={{ textAlign: 'center' }}>
                        <Title order={5} style={{ marginBottom: 8 }}>
                            {activeFilterCount > 0 ? t('UI_NO_CARDS_MATCH') : t('UI_NO_CARDS_ASSIGNED')}
                        </Title>
                        <Text c="dimmed">
                            {activeFilterCount > 0
                                ? t('UI_TRY_ADJUSTING_FILTERS')
                                : t('UI_CARDS_APPEAR_HERE')
                            }
                        </Text>
                    </div>
                </Center>
            ) : (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ width: 40, padding: '8px' }}></th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_CARD')}</th>
                                <th style={{ padding: '8px', textAlign: 'left', width: 150 }}>{t('UI_LIST')}</th>
                                <th style={{ padding: '8px', textAlign: 'left', width: 200 }}>{t('UI_LABELS')}</th>
                                <th style={{ padding: '8px', textAlign: 'left', width: 120 }}>{t('UI_DUE_DATE')}</th>
                                <th style={{ padding: '8px', textAlign: 'left', width: 220 }}>{t('UI_BOARD')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(cards as AssignedCard[]).map((card) => (
                                <tr key={card.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <div onClick={(e) => handleToggleComplete(card, e)} style={{ cursor: 'pointer' }}>
                                            {card.is_completed ? (
                                                <IconCircleCheckFilled size={18} style={{ color: '#52c41a' }} />
                                            ) : (
                                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-secondary)' }} />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <Text fw={700} style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => handleCardClick(card)}>{card.title}</Text>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <Text c="dimmed">{card.list?.title || '-'}</Text>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {card.labels?.map((cardLabel) => (
                                                <Badge key={cardLabel.id} style={{ backgroundColor: cardLabel.label?.color || '#666', color: '#fff', border: 'none' }}>
                                                    {cardLabel.label?.name || ''}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px' }}>{renderDueDate(card)}</td>
                                    <td style={{ padding: '8px' }}>
                                        {card.list?.board ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 48, height: 36, borderRadius: 4, background: card.list.board.background_image ? `url(${card.list.board.background_image}) center/cover` : card.list.board.background_color || '#206A5D', flexShrink: 0 }} />
                                                <div>
                                                    <Text fw={700} size="sm" style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={(e) => handleBoardClick(e, card)}>{card.list.board.title}</Text>
                                                    {card.list.board.workspace && <Text size="xs" c="dimmed">{card.list.board.workspace.name}</Text>}
                                                </div>
                                            </div>
                                        ) : <Text c="dimmed">-</Text>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Filter Drawer */}
            <Drawer
                title={t('UI_FILTER_CARDS')}
                opened={filterOpen}
                onClose={handleCloseFilter}
                size="sm"
                position="right"
            >
                {activeFilterCount > 0 && (
                    <Button variant="subtle" onClick={handleClearFilters} style={{ marginBottom: 16 }}>
                        {t('UI_CLEAR_ALL')}
                    </Button>
                )}
                {/* Card keyword */}
                <div style={{ marginBottom: 24 }}>
                    <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>{t('UI_CARD')}</Text>
                    <TextInput
                        placeholder={t('UI_ENTER_KEYWORD')}
                        value={pendingFilters.keyword}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, keyword: e.target.value }))}

                    />
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {t('UI_FILTER_BY_KEYWORD')}
                    </Text>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Card status */}
                <div style={{ marginBottom: 24 }}>
                    <Text fw={700} style={{ display: 'block', marginBottom: 12 }}>{t('UI_CARD_STATUS')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.status.complete}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                status: { ...prev.status, complete: e.currentTarget.checked }
                            }))}
                            label={
                                <span>
                                    <IconCircleCheckFilled size={14} style={{ color: '#52c41a', marginRight: 8, verticalAlign: 'middle' }} />
                                    {t('UI_MARKED_COMPLETE')}
                                </span>
                            }
                        />
                        <Checkbox
                            checked={pendingFilters.status.incomplete}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                status: { ...prev.status, incomplete: e.currentTarget.checked }
                            }))}
                            label={
                                <span>
                                    <div style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--text-secondary)', marginRight: 8, verticalAlign: 'middle' }} />
                                    {t('UI_NOT_MARKED_COMPLETE')}
                                </span>
                            }
                        />
                    </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Due date */}
                <div style={{ marginBottom: 24 }}>
                    <Text fw={700} style={{ display: 'block', marginBottom: 12 }}>{t('UI_DUE_DATE')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.dueDate.noDates}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, noDates: e.currentTarget.checked }
                            }))}
                            label={<span><IconCalendar size={14} style={{ marginRight: 8, color: 'var(--text-secondary)', verticalAlign: 'middle' }} />{t('UI_NO_DATES')}</span>}
                        />
                        <Checkbox
                            checked={pendingFilters.dueDate.overdue}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, overdue: e.currentTarget.checked }
                            }))}
                            label={<span><IconAlertCircle size={14} style={{ marginRight: 8, color: '#ff4d4f', verticalAlign: 'middle' }} />{t('UI_OVERDUE')}</span>}
                        />
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextDay}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextDay: e.currentTarget.checked }
                            }))}
                            label={<span><IconClock size={14} style={{ marginRight: 8, color: '#faad14', verticalAlign: 'middle' }} />{t('UI_DUE_NEXT_DAY')}</span>}
                        />
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextWeek}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextWeek: e.currentTarget.checked }
                            }))}
                            label={<span><IconClock size={14} style={{ marginRight: 8, color: 'var(--text-secondary)', verticalAlign: 'middle' }} />{t('UI_DUE_NEXT_WEEK')}</span>}
                        />
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextMonth}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextMonth: e.currentTarget.checked }
                            }))}
                            label={<span><IconClock size={14} style={{ marginRight: 8, color: 'var(--text-secondary)', verticalAlign: 'middle' }} />{t('UI_DUE_NEXT_MONTH')}</span>}
                        />
                    </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Board */}
                <div style={{ marginBottom: 24 }}>
                    <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>{t('UI_BOARD')}</Text>
                    <MultiSelect
                        placeholder={t('UI_FILTER_BY_BOARD')}
                        value={pendingFilters.boardIds}
                        onChange={(value) => setPendingFilters(prev => ({ ...prev, boardIds: value }))}
                        style={{ width: '100%' }}
                        data={uniqueBoards.map(board => ({
                            value: board.id,
                            label: board.title,
                        }))}
                    />
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Activity */}
                <div style={{ marginBottom: 24 }}>
                    <Text fw={700} style={{ display: 'block', marginBottom: 12 }}>{t('UI_ACTIVITY')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.activity.lastDay}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastDay: e.currentTarget.checked }
                            }))}
                            label={t('UI_ACTIVE_LAST_DAY')}
                        />
                        <Checkbox
                            checked={pendingFilters.activity.lastWeek}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastWeek: e.currentTarget.checked }
                            }))}
                            label={t('UI_ACTIVE_LAST_WEEK')}
                        />
                        <Checkbox
                            checked={pendingFilters.activity.lastMonth}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastMonth: e.currentTarget.checked }
                            }))}
                            label={t('UI_ACTIVE_LAST_MONTH')}
                        />
                        <Checkbox
                            checked={pendingFilters.activity.lastYear}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastYear: e.currentTarget.checked }
                            }))}
                            label={t('UI_ACTIVE_LAST_YEAR')}
                        />
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
