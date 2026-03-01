'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BoardList, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import EditableTitle from '@/components/common/EditableTitle';
import api from '@/lib/api';
import { FilterState } from '@/components/board/BoardFilterPopover';
import { isDueSoon, isDueLater, isOverdue } from '@/components/common/DueDateTag';
import KanbanCard from './KanbanCard';
import styles from './KanbanBoard.module.css';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { TextInput, Textarea, Button, Menu, Popover, Group, Divider, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDots, IconPlus, IconPalette, IconTrash, IconX, IconCopy, IconArrowsExchange, IconSortAscending, IconEye, IconEyeOff, IconInbox, IconColumnInsertRight, IconChevronRight } from '@tabler/icons-react';
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
    const t = useTranslation();
    const token = useAppToken();
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
                            border: list.color === color ? `2px solid ${token.colorWhite}` : 'none',
                            boxShadow: list.color === color ? `0 0 0 2px ${token.colorPrimary}` : 'none',
                        }}
                    />
                ))}
            </div>
            {list.color && (
                <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Button
                        variant="subtle"
                        leftSection={<IconX size={16} />}
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
            icon: isWatching ? <IconEyeOff size={16} /> : <IconEye size={16} />,
            onClick: handleToggleWatch,
        },
        {
            key: 'copy',
            label: t('UI_COPY_LIST'),
            icon: <IconCopy size={16} />,
            onClick: handleOpenCopyModal,
        },
        {
            key: 'move-all',
            label: t('UI_MOVE_ALL_CARDS'),
            icon: <IconArrowsExchange size={16} />,
            onClick: () => {
                setMenuOpen(false);
                setTargetListId('');
                setMoveModalOpen(true);
            },
        },
        {
            key: 'sort',
            label: t('UI_SORT_BY'),
            icon: <IconSortAscending size={16} />,
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
            icon: <IconPalette size={16} />,
            onClick: handleOpenColorPicker,
        },
        { type: 'divider' as const },
        {
            key: 'archive-all-cards',
            label: t('UI_ARCHIVE_ALL_CARDS'),
            icon: <IconInbox size={16} />,
            onClick: () => {
                setMenuOpen(false);
                /* TODO: implement confirmation dialog */ ({
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
            icon: <IconInbox size={16} />,
            onClick: () => {
                setMenuOpen(false);
                /* TODO: implement confirmation dialog */ ({
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
            icon: <IconTrash size={16} />,
            onClick: () => {
                setMenuOpen(false);
                /* TODO: implement confirmation dialog */ ({
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
                    background: list.color || token.colorOverlayLight,
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
                    boxShadow: `0 4px 16px ${token.colorShadowLight}`,
                }}
                {...attributes}
                {...listeners}
                onClick={handleToggleCollapse}
            >
                <IconColumnInsertRight size={16}
                    style={{
                        color: list.color ? token.colorWhite : token.colorTemplateDarkText,
                        marginBottom: 12,
                    }}
                />
                <div
                    style={{
                        writingMode: 'vertical-rl',
                        fontWeight: 600,
                        fontSize: 14,
                        color: list.color ? token.colorWhite : token.colorTemplateDarkText,
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
                        color: list.color ? 'rgba(255,255,255,0.8)' : token.colorMutedText,
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
                style={list.color ? { color: token.colorWhite } : undefined}
            >
                <EditableTitle
                    value={list.title}
                    onSave={handleTitleSave}
                    disabled={readOnly}
                    style={{ flex: 1 }}
                    textStyle={{ color: list.color ? token.colorWhite : undefined }}
                    size="sm"
                />
                <Popover
                    opened={colorPickerOpen}
                    onChange={setColorPickerOpen}
                    position="bottom-end"
                >
                    <Popover.Target>
                        <span />
                    </Popover.Target>
                    <Popover.Dropdown>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('UI_LIST_COLOR')}</div>
                        {colorPickerContent}
                    </Popover.Dropdown>
                </Popover>
                {!readOnly && (
                    <>
                        <Button
                            variant="subtle"
                            size="sm"
                            leftSection={<IconColumnInsertRight size={16} />}
                            onClick={handleToggleCollapse}
                            title={t('UI_COLLAPSE_LIST')}
                            style={list.color ? { color: token.colorWhite } : undefined}
                        />
                        <Menu
                            trigger="click"
                            opened={menuOpen}
                            onChange={setMenuOpen}
                            position="bottom-end"
                        >
                            <Menu.Target>
                                <Button
                                    variant="subtle"
                                    size="sm"
                                    leftSection={<IconDots size={16} />}
                                    style={list.color ? { color: token.colorWhite } : undefined}
                                />
                            </Menu.Target>
                            <Menu.Dropdown>
                                {menuItems.map((item: any, index: number) => {
                                    if (item.type === 'divider') return <Menu.Divider key={`div-${index}`} />;
                                    if (item.children) {
                                        return (
                                            <Menu key={item.key} trigger="hover" position="right-start" withinPortal>
                                                <Menu.Target>
                                                    <Menu.Item leftSection={item.icon} rightSection={<IconChevronRight size={14} />}>
                                                        {item.label}
                                                    </Menu.Item>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    {item.children.map((child: any) => (
                                                        <Menu.Item key={child.key} onClick={child.onClick}>
                                                            {child.label}
                                                        </Menu.Item>
                                                    ))}
                                                </Menu.Dropdown>
                                            </Menu>
                                        );
                                    }
                                    return (
                                        <Menu.Item key={item.key} leftSection={item.icon} color={item.danger ? 'red' : undefined} onClick={item.onClick}>
                                            {item.label}
                                        </Menu.Item>
                                    );
                                })}
                            </Menu.Dropdown>
                        </Menu>
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
                    <Textarea
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder={t('UI_PLACEHOLDER_CARD_TITLE')}
                        autosize
                        minRows={2}
                        maxRows={4}
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
                        <Button size="sm" onClick={handleAddCard}>
                            {t('UI_ADD_CARD')}
                        </Button>
                        <Button
                            size="sm"
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
                    variant="subtle"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setIsAddingCard(true)}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        ...(list.color ? { color: token.colorWhite } : {}),
                    }}
                >
                    {t('UI_ADD_A_CARD')}
                </Button>
            ))}

            {/* Copy List Modal */}
            <Modal
                title={t('UI_COPY_LIST')}
                opened={copyModalOpen}
                onClose={() => setCopyModalOpen(false)}
            >
                <div style={{ marginBottom: 8 }}>{t('UI_NAME')}</div>
                <TextInput
                    value={copyTitle}
                    onChange={(e) => setCopyTitle(e.target.value)}
                    placeholder={t('UI_PLACEHOLDER_LIST_NAME')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleCopyList(); }}
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setCopyModalOpen(false)}>{t('UI_CANCEL')}</Button>
                    <Button onClick={handleCopyList}>{t('UI_CREATE_LIST')}</Button>
                </Group>
            </Modal>

            {/* Move All Cards Modal */}
            <Modal
                title={t('UI_MOVE_ALL_CARDS_TITLE')}
                opened={moveModalOpen}
                onClose={() => setMoveModalOpen(false)}
            >
                <div style={{ marginBottom: 8 }}>{t('UI_SELECT_DESTINATION_LIST')}</div>
                <Select
                    value={targetListId || null}
                    onChange={(val) => setTargetListId(val || '')}
                    placeholder={t('UI_PLACEHOLDER_CHOOSE_LIST')}
                    style={{ width: '100%' }}
                    data={lists
                        .filter(l => l.id !== list.id)
                        .map(l => ({ value: l.id, label: l.title }))
                    }
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setMoveModalOpen(false)}>{t('UI_CANCEL')}</Button>
                    <Button
                        disabled={!targetListId}
                        onClick={() => {
                            if (targetListId) {
                                moveAllCards(list.id, targetListId);
                                setMoveModalOpen(false);
                            }
                        }}
                    >
                        {t('UI_MOVE')}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
