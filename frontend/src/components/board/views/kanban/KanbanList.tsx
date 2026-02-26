'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input, Button, Dropdown, Popover, Space, Divider, Modal, Select, App } from 'antd';
import { MoreOutlined, PlusOutlined, BgColorsOutlined, DeleteOutlined, CloseOutlined, CopyOutlined, SwapOutlined, SortAscendingOutlined, EyeOutlined, EyeInvisibleOutlined, InboxOutlined, ColumnWidthOutlined } from '@ant-design/icons';
import { BoardList, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import EditableTitle from '@/components/common/EditableTitle';
import api from '@/lib/api';
import { FilterState } from '@/components/board/BoardFilterPopover';
import { isDueSoon, isDueLater, isOverdue } from '@/components/common/DueDateTag';
import KanbanCard from './KanbanCard';
import styles from './KanbanBoard.module.css';
import { useTranslation } from '@/hooks/useLabels';

const LIST_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface KanbanListProps {
    list: BoardList;
    filters?: FilterState;
    readOnly?: boolean;
    onCardClick?: (card: Card) => void;
    showCovers?: boolean;
    onAddCard?: (listId: string, title: string) => void;
    onDeleteCard?: (cardId: string) => void;
}

function matchesFilters(card: Card, filters: FilterState): boolean {
    // Search filter (title or description)
    if (filters.search) {
        const search = filters.search.toLowerCase();
        const titleMatch = card.title.toLowerCase().includes(search);
        const descMatch = card.description?.toLowerCase().includes(search) || false;
        if (!titleMatch && !descMatch) return false;
    }

    // Label filter
    if (filters.labelIds.length > 0 || filters.noLabels) {
        const cardLabelIds = (card.labels || []).map((l: { label_id: string }) => l.label_id);
        const matchesNoLabels = filters.noLabels && cardLabelIds.length === 0;
        const matchesSpecific = filters.labelIds.length > 0 && filters.labelIds.some(id => cardLabelIds.includes(id));
        if (!matchesNoLabels && !matchesSpecific) return false;
    }

    // Member filter
    if (filters.memberIds.length > 0 || filters.noMembers) {
        const cardMemberIds = (card.members || []).map((m: { user_id: string }) => m.user_id);
        const matchesNoMembers = filters.noMembers && cardMemberIds.length === 0;
        const matchesSpecific = filters.memberIds.length > 0 && filters.memberIds.some(id => cardMemberIds.includes(id));
        if (!matchesNoMembers && !matchesSpecific) return false;
    }

    // Due date filter
    if (filters.dueDate) {
        switch (filters.dueDate) {
            case 'overdue':
                if (!card.due_date || !isOverdue(card.due_date)) return false;
                break;
            case 'due_soon':
                if (!card.due_date || !isDueSoon(card.due_date)) return false;
                break;
            case 'due_later':
                if (!card.due_date || !isDueLater(card.due_date)) return false;
                break;
            case 'no_date':
                if (card.due_date) return false;
                break;
        }
    }

    return true;
}

export default function KanbanList({ list, filters, readOnly = false, onCardClick, showCovers, onAddCard, onDeleteCard }: KanbanListProps) {
    const { modal } = App.useApp();
    const t = useTranslation();
    const { updateList, updateListColor, deleteList, copyList, moveAllCards, sortCards, createCard, lists } = useBoardStore();
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copyTitle, setCopyTitle] = useState('');
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [targetListId, setTargetListId] = useState<string>('');
    const [isWatching, setIsWatching] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(list.is_collapsed || false);

    // Sync collapsed state with list prop
    useEffect(() => {
        setIsCollapsed(list.is_collapsed || false);
    }, [list.is_collapsed]);

    // Check if user is watching this list
    useEffect(() => {
        api.get(`/lists/${list.id}/watching`)
            .then(res => setIsWatching(res.data.data?.is_watching || false))
            .catch(() => { });
    }, [list.id]);

    const handleToggleCollapse = async () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        try {
            await api.put(`/lists/${list.id}`, { is_collapsed: newCollapsed });
        } catch (error) {
            console.error('Failed to update collapse state:', error);
            setIsCollapsed(!newCollapsed); // Revert on error
        }
    };

    const handleToggleWatch = async () => {
        try {
            if (isWatching) {
                await api.delete(`/lists/${list.id}/watch`);
                setIsWatching(false);
            } else {
                await api.post(`/lists/${list.id}/watch`);
                setIsWatching(true);
            }
        } catch (error) {
            console.error('Failed to toggle watch:', error);
        }
        setMenuOpen(false);
    };

    // Filter cards based on active filters
    const filteredCards = useMemo(() => {
        const cards = list.cards || [];
        if (!filters) return cards;
        return cards.filter((card: Card) => matchesFilters(card, filters));
    }, [list.cards, filters]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: list.id,
        data: {
            type: 'list',
            list,
        },
        disabled: readOnly,
    });

    // Add droppable for empty space at bottom
    const { setNodeRef: setDroppableRef } = useDroppable({
        id: `${list.id}-droppable`,
        data: {
            type: 'list',
            listId: list.id,
        },
        disabled: readOnly,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleTitleSave = async (newTitle: string) => {
        await updateList(list.id, newTitle);
    };

    const handleAddCard = () => {
        if (newCardTitle.trim()) {
            if (onAddCard) {
                onAddCard(list.id, newCardTitle.trim());
            } else {
                createCard(list.id, newCardTitle.trim());
            }
            setNewCardTitle('');
        }
        setIsAddingCard(false);
    };

    const handleColorChange = (color: string | null) => {
        updateListColor(list.id, color);
        setColorPickerOpen(false);
    };

    const handleOpenColorPicker = () => {
        setMenuOpen(false);
        setTimeout(() => setColorPickerOpen(true), 100);
    };

    const colorPickerContent = (
        <div style={{ width: 200 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {LIST_COLORS.map((color) => (
                    <div
                        key={color}
                        onClick={() => handleColorChange(color)}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            backgroundColor: color,
                            cursor: 'pointer',
                            border: list.color === color ? '2px solid #fff' : 'none',
                            boxShadow: list.color === color ? '0 0 0 2px #1890ff' : 'none',
                        }}
                    />
                ))}
            </div>
            {list.color && (
                <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => handleColorChange(null)}
                        style={{ width: '100%' }}
                    >
                        {t('UI_REMOVE_COLOR')}
                    </Button>
                </>
            )}
        </div>
    );

    const handleOpenCopyModal = () => {
        setCopyTitle(list.title);
        setMenuOpen(false);
        setCopyModalOpen(true);
    };

    const handleCopyList = () => {
        if (copyTitle.trim()) {
            copyList(list.id, copyTitle.trim());
            setCopyModalOpen(false);
        }
    };

    const menuItems = [
        {
            key: 'watch',
            label: isWatching ? t('UI_UNWATCH') : t('UI_WATCH'),
            icon: isWatching ? <EyeInvisibleOutlined /> : <EyeOutlined />,
            onClick: handleToggleWatch,
        },
        {
            key: 'copy',
            label: t('UI_COPY_LIST'),
            icon: <CopyOutlined />,
            onClick: handleOpenCopyModal,
        },
        {
            key: 'move-all',
            label: t('UI_MOVE_ALL_CARDS'),
            icon: <SwapOutlined />,
            onClick: () => {
                setMenuOpen(false);
                setTargetListId('');
                setMoveModalOpen(true);
            },
        },
        {
            key: 'sort',
            label: t('UI_SORT_BY'),
            icon: <SortAscendingOutlined />,
            children: [
                {
                    key: 'sort-newest',
                    label: t('UI_SORT_DATE_NEWEST'),
                    onClick: () => sortCards(list.id, 'date_newest'),
                },
                {
                    key: 'sort-oldest',
                    label: t('UI_SORT_DATE_OLDEST'),
                    onClick: () => sortCards(list.id, 'date_oldest'),
                },
                {
                    key: 'sort-alpha',
                    label: t('UI_SORT_ALPHABETICAL'),
                    onClick: () => sortCards(list.id, 'alphabetical'),
                },
            ],
        },
        {
            key: 'color',
            label: t('UI_CHANGE_COLOR'),
            icon: <BgColorsOutlined />,
            onClick: handleOpenColorPicker,
        },
        { type: 'divider' as const },
        {
            key: 'archive-all-cards',
            label: t('UI_ARCHIVE_ALL_CARDS'),
            icon: <InboxOutlined />,
            onClick: () => {
                setMenuOpen(false);
                modal.confirm({
                    title: t('UI_ARCHIVE_ALL_CARDS_TITLE'),
                    content: `${t('UI_ARCHIVE_ALL_CARDS_CONFIRM')} ${list.cards?.length || 0} ${t('UI_CARDS_IN')} "${list.title}"?`,
                    okText: t('UI_ARCHIVE_ALL'),
                    cancelText: t('UI_CANCEL'),
                    onOk: async () => {
                        try {
                            await api.post(`/lists/${list.id}/archive-all-cards`);
                            // Refresh board to reflect changes
                            const { fetchBoard, currentBoard } = useBoardStore.getState();
                            if (currentBoard) {
                                fetchBoard(currentBoard.id);
                            }
                        } catch (error) {
                            console.error('Failed to archive all cards:', error);
                        }
                    },
                });
            },
        },
        {
            key: 'archive-list',
            label: t('UI_ARCHIVE_THIS_LIST'),
            icon: <InboxOutlined />,
            onClick: () => {
                setMenuOpen(false);
                modal.confirm({
                    title: t('UI_ARCHIVE_LIST_TITLE'),
                    content: `${t('UI_ARCHIVE_LIST_CONFIRM')} "${list.title}"? ${t('UI_HIDDEN_FROM_BOARD')}`,
                    okText: t('UI_ARCHIVE'),
                    cancelText: t('UI_CANCEL'),
                    onOk: async () => {
                        try {
                            await api.put(`/lists/${list.id}/archive`);
                            // Refresh board to reflect changes
                            const { fetchBoard, currentBoard } = useBoardStore.getState();
                            if (currentBoard) {
                                fetchBoard(currentBoard.id);
                            }
                        } catch (error) {
                            console.error('Failed to archive list:', error);
                        }
                    },
                });
            },
        },
        { type: 'divider' as const },
        {
            key: 'delete',
            label: t('UI_DELETE_LIST'),
            danger: true,
            icon: <DeleteOutlined />,
            onClick: () => {
                setMenuOpen(false);
                modal.confirm({
                    title: t('UI_DELETE_LIST_TITLE'),
                    content: `${t('UI_DELETE_LIST_BODY')} "${list.title}"? ${t('UI_CANNOT_UNDO')}`,
                    okText: t('UI_DELETE'),
                    okType: 'danger',
                    onOk: () => deleteList(list.id),
                });
            },
        },
    ];

    // Collapsed view
    if (isCollapsed) {
        return (
            <div
                ref={setNodeRef}
                style={{
                    ...style,
                    width: 40,
                    minWidth: 40,
                    height: 'fit-content',
                    background: list.color || 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 12,
                    padding: '12px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                }}
                {...attributes}
                {...listeners}
                onClick={handleToggleCollapse}
            >
                <ColumnWidthOutlined
                    style={{
                        color: list.color ? '#fff' : '#172b4d',
                        marginBottom: 12,
                    }}
                />
                <div
                    style={{
                        writingMode: 'vertical-rl',
                        fontWeight: 600,
                        fontSize: 14,
                        color: list.color ? '#fff' : '#172b4d',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {list.title}
                </div>
                <div
                    style={{
                        marginTop: 12,
                        fontWeight: 600,
                        fontSize: 12,
                        color: list.color ? 'rgba(255,255,255,0.8)' : '#5e6c84',
                    }}
                >
                    {filteredCards.length}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={readOnly ? undefined : setNodeRef}
            style={{
                ...(readOnly ? {} : style),
                ...(list.color ? { background: `${list.color}a6` } : {}), // a6 = 65% opacity
            }}
            className={styles.list}
        >
            {/* List Header */}
            <div
                className={styles.listHeader}
                {...(readOnly ? {} : attributes)}
                {...(readOnly ? {} : listeners)}
                style={list.color ? { color: '#fff' } : undefined}
            >
                <EditableTitle
                    value={list.title}
                    onSave={handleTitleSave}
                    disabled={readOnly}
                    style={{ flex: 1 }}
                    textStyle={{ color: list.color ? '#fff' : undefined }}
                    size="small"
                />
                <Popover
                    content={colorPickerContent}
                    title={t('UI_LIST_COLOR')}
                    trigger="click"
                    open={colorPickerOpen}
                    onOpenChange={setColorPickerOpen}
                    placement="bottomRight"
                >
                    <span />
                </Popover>
                {!readOnly && (
                    <>
                        <Button
                            type="text"
                            size="small"
                            icon={<ColumnWidthOutlined />}
                            onClick={handleToggleCollapse}
                            title={t('UI_COLLAPSE_LIST')}
                            style={list.color ? { color: '#fff' } : undefined}
                        />
                        <Dropdown
                            menu={{ items: menuItems }}
                            trigger={['click']}
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<MoreOutlined />}
                                style={list.color ? { color: '#fff' } : undefined}
                            />
                        </Dropdown>
                    </>
                )}
            </div>

            {/* Cards */}
            <div className={styles.listContent}>
                <SortableContext
                    items={filteredCards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {filteredCards.map((card) => (
                        <KanbanCard key={card.id} card={card} listId={list.id} readOnly={readOnly} onCardClick={onCardClick} showCovers={showCovers} onDeleteCard={onDeleteCard} />
                    ))}
                </SortableContext>
                {/* Droppable zone at the bottom */}
                {!readOnly && (
                    <div
                        ref={setDroppableRef}
                    />
                )}
            </div>

            {/* Add Card - only show when not readOnly */}
            {!readOnly && (isAddingCard ? (
                <div style={{ padding: '4px 0' }}>
                    <Input.TextArea
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder={t('UI_PLACEHOLDER_CARD_TITLE')}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        autoFocus
                        onBlur={() => {
                            if (!newCardTitle.trim()) {
                                setIsAddingCard(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddCard();
                            }
                            if (e.key === 'Escape') {
                                setIsAddingCard(false);
                                setNewCardTitle('');
                            }
                        }}
                    />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <Button type="primary" size="small" onClick={handleAddCard}>
                            {t('UI_ADD_CARD')}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setIsAddingCard(false);
                                setNewCardTitle('');
                            }}
                        >
                            {t('UI_CANCEL')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddingCard(true)}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        ...(list.color ? { color: '#fff' } : {}),
                    }}
                >
                    {t('UI_ADD_A_CARD')}
                </Button>
            ))}

            {/* Copy List Modal */}
            <Modal
                title={t('UI_COPY_LIST')}
                open={copyModalOpen}
                onOk={handleCopyList}
                onCancel={() => setCopyModalOpen(false)}
                okText={t('UI_CREATE_LIST')}
                cancelText={t('UI_CANCEL')}
            >
                <div style={{ marginBottom: 8 }}>{t('UI_NAME')}</div>
                <Input
                    value={copyTitle}
                    onChange={(e) => setCopyTitle(e.target.value)}
                    placeholder={t('UI_PLACEHOLDER_LIST_NAME')}
                    autoFocus
                    onPressEnter={handleCopyList}
                />
            </Modal>

            {/* Move All Cards Modal */}
            <Modal
                title={t('UI_MOVE_ALL_CARDS_TITLE')}
                open={moveModalOpen}
                onOk={() => {
                    if (targetListId) {
                        moveAllCards(list.id, targetListId);
                        setMoveModalOpen(false);
                    }
                }}
                onCancel={() => setMoveModalOpen(false)}
                okText={t('UI_MOVE')}
                cancelText={t('UI_CANCEL')}
                okButtonProps={{ disabled: !targetListId }}
            >
                <div style={{ marginBottom: 8 }}>{t('UI_SELECT_DESTINATION_LIST')}</div>
                <Select
                    value={targetListId || undefined}
                    onChange={setTargetListId}
                    placeholder={t('UI_PLACEHOLDER_CHOOSE_LIST')}
                    style={{ width: '100%' }}
                    options={lists
                        .filter(l => l.id !== list.id)
                        .map(l => ({ value: l.id, label: l.title }))
                    }
                />
            </Modal>
        </div>
    );
}
