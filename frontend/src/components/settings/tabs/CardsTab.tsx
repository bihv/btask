'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Table, Tag, Empty, Spin, Button, Drawer, Input, Checkbox, Select, Divider, Badge, App } from 'antd';
import { CreditCardOutlined, ClockCircleOutlined, CheckCircleFilled, FilterOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMyCards, useUpdateCard, CardFilters as ApiCardFilters } from '@/hooks/useCards';
import { Card, CardLabel, BoardList, Board, Workspace } from '@/types';
import dayjs from 'dayjs';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

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
    const { message } = App.useApp();
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
            message.error(t('ERROR_UPDATE_CARD'));
        }
    };

    const handleClearFilters = () => {
        setPendingFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
    };

    const columns: ColumnsType<AssignedCard> = [
        {
            title: '',
            key: 'complete',
            width: 40,
            render: (_, record) => (
                <div
                    onClick={(e) => handleToggleComplete(record, e)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {record.is_completed ? (
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                    ) : (
                        <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: '2px solid var(--text-secondary)',
                        }} />
                    )}
                </div>
            ),
        },
        {
            title: t('UI_CARD'),
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
            render: (title: string, record) => (
                <Button
                    type="link"
                    onClick={() => handleCardClick(record)}
                    style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                >
                    <Text strong style={{ color: 'var(--text-primary)' }}>{title}</Text>
                </Button>
            ),
        },
        {
            title: t('UI_LIST'),
            dataIndex: ['list', 'title'],
            key: 'list',
            width: 150,
            sorter: (a, b) => (a.list?.title || '').localeCompare(b.list?.title || ''),
            render: (title: string) => (
                <Text style={{ color: 'var(--text-secondary)' }}>{title || '-'}</Text>
            ),
        },
        {
            title: t('UI_LABELS'),
            dataIndex: 'labels',
            key: 'labels',
            width: 200,
            sorter: (a, b) => (a.labels?.length || 0) - (b.labels?.length || 0),
            render: (labels: CardLabel[]) => (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {labels?.map((cardLabel) => (
                        <Tag
                            key={cardLabel.id}
                            style={{
                                backgroundColor: cardLabel.label?.color || '#666',
                                color: '#fff',
                                border: 'none',
                                marginRight: 0,
                            }}
                        >
                            {cardLabel.label?.name || ''}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: t('UI_DUE_DATE'),
            dataIndex: 'due_date',
            key: 'due_date',
            width: 120,
            sorter: (a, b) => {
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            },
            defaultSortOrder: 'ascend',
            render: (dueDate: string, record) => {
                if (!dueDate) return <Text style={{ color: 'var(--text-secondary)' }}>-</Text>;

                const date = dayjs(dueDate);
                const now = dayjs();
                const isOverdue = date.isBefore(now) && !record.is_completed;
                const isDueSoon = date.diff(now, 'day') <= 1 && date.isAfter(now) && !record.is_completed;

                let bgColor = 'var(--bg-secondary)';
                let textColor = 'var(--text-primary)';

                if (record.is_completed) {
                    bgColor = '#52c41a';
                    textColor = '#fff';
                } else if (isOverdue) {
                    bgColor = '#ff4d4f';
                    textColor = '#fff';
                } else if (isDueSoon) {
                    bgColor = '#faad14';
                    textColor = '#fff';
                }

                return (
                    <Tag
                        icon={<ClockCircleOutlined />}
                        style={{
                            backgroundColor: bgColor,
                            color: textColor,
                            border: 'none',
                        }}
                    >
                        {date.format('MMM D')}
                    </Tag>
                );
            },
        },
        {
            title: t('UI_CREATED'),
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            render: (createdAt: string) => (
                <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {dayjs(createdAt).format('MMM D')}
                </Text>
            ),
        },
        {
            title: t('UI_UPDATED'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 100,
            sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
            render: (updatedAt: string) => (
                <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {dayjs(updatedAt).format('MMM D')}
                </Text>
            ),
        },
        {
            title: t('UI_BOARD'),
            key: 'board',
            width: 220,
            sorter: (a, b) => (a.list?.board?.title || '').localeCompare(b.list?.board?.title || ''),
            render: (_, record) => {
                const board = record.list?.board;
                const workspace = board?.workspace;

                if (!board) return <Text style={{ color: 'var(--text-secondary)' }}>-</Text>;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 48,
                                height: 36,
                                borderRadius: 4,
                                background: board.background_image
                                    ? `url(${board.background_image}) center/cover`
                                    : board.background_color || '#0079bf',
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ minWidth: 0 }}>
                            <Button
                                type="link"
                                onClick={(e) => handleBoardClick(e, record)}
                                style={{ padding: 0, height: 'auto', lineHeight: 1.3 }}
                            >
                                <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{board.title}</Text>
                            </Button>
                            {workspace && (
                                <div>
                                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                        {workspace.name}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>{t('UI_CARDS')}</Title>
                <Badge count={activeFilterCount} size="small">
                    <Button
                        icon={<FilterOutlined />}
                        onClick={handleOpenFilter}
                    >
                        {t('UI_FILTER')}
                    </Button>
                </Badge>
            </div>

            {(cards as AssignedCard[]).length === 0 ? (
                <Empty
                    image={<CreditCardOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />}
                    description={
                        <div>
                            <Title level={5} style={{ marginBottom: 8 }}>
                                {activeFilterCount > 0 ? t('UI_NO_CARDS_MATCH') : t('UI_NO_CARDS_ASSIGNED')}
                            </Title>
                            <Text style={{ color: 'var(--text-secondary)' }}>
                                {activeFilterCount > 0
                                    ? t('UI_TRY_ADJUSTING_FILTERS')
                                    : t('UI_CARDS_APPEAR_HERE')
                                }
                            </Text>
                        </div>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={cards as AssignedCard[]}
                    rowKey="id"
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 8,
                    }}
                />
            )}

            {/* Filter Drawer */}
            <Drawer
                title={t('UI_FILTER_CARDS')}
                open={filterOpen}
                onClose={handleCloseFilter}
                width={360}
                extra={
                    activeFilterCount > 0 && (
                        <Button type="link" onClick={handleClearFilters}>
                            {t('UI_CLEAR_ALL')}
                        </Button>
                    )
                }
            >
                {/* Card keyword */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('UI_CARD')}</Text>
                    <Input
                        placeholder={t('UI_ENTER_KEYWORD')}
                        value={pendingFilters.keyword}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        allowClear
                    />
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {t('UI_FILTER_BY_KEYWORD')}
                    </Text>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Card status */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('UI_CARD_STATUS')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.status.complete}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                status: { ...prev.status, complete: e.target.checked }
                            }))}
                        >
                            <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                            {t('UI_MARKED_COMPLETE')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.status.incomplete}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                status: { ...prev.status, incomplete: e.target.checked }
                            }))}
                        >
                            <div style={{
                                display: 'inline-block',
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                border: '2px solid var(--text-secondary)',
                                marginRight: 8,
                                verticalAlign: 'middle',
                            }} />
                            {t('UI_NOT_MARKED_COMPLETE')}
                        </Checkbox>
                    </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Due date */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('UI_DUE_DATE')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.dueDate.noDates}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, noDates: e.target.checked }
                            }))}
                        >
                            <CalendarOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
                            {t('UI_NO_DATES')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.dueDate.overdue}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, overdue: e.target.checked }
                            }))}
                        >
                            <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                            {t('UI_OVERDUE')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextDay}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextDay: e.target.checked }
                            }))}
                        >
                            <ClockCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
                            {t('UI_DUE_NEXT_DAY')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextWeek}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextWeek: e.target.checked }
                            }))}
                        >
                            <ClockCircleOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
                            {t('UI_DUE_NEXT_WEEK')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.dueDate.dueNextMonth}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                dueDate: { ...prev.dueDate, dueNextMonth: e.target.checked }
                            }))}
                        >
                            <ClockCircleOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
                            {t('UI_DUE_NEXT_MONTH')}
                        </Checkbox>
                    </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Board */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('UI_BOARD')}</Text>
                    <Select
                        mode="multiple"
                        placeholder={t('UI_FILTER_BY_BOARD')}
                        value={pendingFilters.boardIds}
                        onChange={(value) => setPendingFilters(prev => ({ ...prev, boardIds: value }))}
                        style={{ width: '100%' }}
                        options={uniqueBoards.map(board => ({
                            value: board.id,
                            label: board.title,
                        }))}
                        allowClear
                    />
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* Activity */}
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('UI_ACTIVITY')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox
                            checked={pendingFilters.activity.lastDay}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastDay: e.target.checked }
                            }))}
                        >
                            {t('UI_ACTIVE_LAST_DAY')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.activity.lastWeek}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastWeek: e.target.checked }
                            }))}
                        >
                            {t('UI_ACTIVE_LAST_WEEK')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.activity.lastMonth}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastMonth: e.target.checked }
                            }))}
                        >
                            {t('UI_ACTIVE_LAST_MONTH')}
                        </Checkbox>
                        <Checkbox
                            checked={pendingFilters.activity.lastYear}
                            onChange={(e) => setPendingFilters(prev => ({
                                ...prev,
                                activity: { ...prev.activity, lastYear: e.target.checked }
                            }))}
                        >
                            {t('UI_ACTIVE_LAST_YEAR')}
                        </Checkbox>
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
