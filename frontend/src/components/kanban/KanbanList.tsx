'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input, Button, Dropdown, Popover, Space, Divider, Modal, Select } from 'antd';
import { MoreOutlined, PlusOutlined, BgColorsOutlined, DeleteOutlined, CloseOutlined, CopyOutlined, SwapOutlined, SortAscendingOutlined, EyeOutlined, EyeInvisibleOutlined, InboxOutlined, ColumnWidthOutlined } from '@ant-design/icons';
import { List, Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api from '@/lib/api';
import { FilterState } from '@/components/board/CardFilterBar';
import KanbanCard from './KanbanCard';

const LIST_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface KanbanListProps {
    list: List;
    filters?: FilterState;
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
    if (filters.labelIds.length > 0) {
        const cardLabelIds = (card.labels || []).map((l: { label_id: string }) => l.label_id);
        const hasLabel = filters.labelIds.some(id => cardLabelIds.includes(id));
        if (!hasLabel) return false;
    }

    // Member filter
    if (filters.memberIds.length > 0) {
        const cardMemberIds = (card.members || []).map((m: { user_id: string }) => m.user_id);
        const hasMember = filters.memberIds.some(id => cardMemberIds.includes(id));
        if (!hasMember) return false;
    }

    // Due date filter
    if (filters.dueDate) {
        const now = new Date();
        const dueDate = card.due_date ? new Date(card.due_date) : null;

        switch (filters.dueDate) {
            case 'overdue':
                if (!dueDate || dueDate >= now) return false;
                break;
            case 'due_soon': {
                const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                if (!dueDate || dueDate < now || dueDate > sevenDaysLater) return false;
                break;
            }
            case 'no_date':
                if (dueDate) return false;
                break;
        }
    }

    return true;
}

export default function KanbanList({ list, filters }: KanbanListProps) {
    const { updateList, updateListColor, deleteList, copyList, moveAllCards, sortCards, createCard, lists } = useBoardStore();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
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
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleTitleSave = () => {
        if (title.trim() && title !== list.title) {
            updateList(list.id, title.trim());
        } else {
            setTitle(list.title);
        }
        setIsEditing(false);
    };

    const handleAddCard = () => {
        if (newCardTitle.trim()) {
            createCard(list.id, newCardTitle.trim());
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
                        Remove color
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
            label: isWatching ? 'Unwatch' : 'Watch',
            icon: isWatching ? <EyeInvisibleOutlined /> : <EyeOutlined />,
            onClick: handleToggleWatch,
        },
        {
            key: 'copy',
            label: 'Copy list',
            icon: <CopyOutlined />,
            onClick: handleOpenCopyModal,
        },
        {
            key: 'move-all',
            label: 'Move all cards',
            icon: <SwapOutlined />,
            onClick: () => {
                setMenuOpen(false);
                setTargetListId('');
                setMoveModalOpen(true);
            },
        },
        {
            key: 'sort',
            label: 'Sort by',
            icon: <SortAscendingOutlined />,
            children: [
                {
                    key: 'sort-newest',
                    label: 'Date created (newest first)',
                    onClick: () => sortCards(list.id, 'date_newest'),
                },
                {
                    key: 'sort-oldest',
                    label: 'Date created (oldest first)',
                    onClick: () => sortCards(list.id, 'date_oldest'),
                },
                {
                    key: 'sort-alpha',
                    label: 'Card name (alphabetically)',
                    onClick: () => sortCards(list.id, 'alphabetical'),
                },
            ],
        },
        {
            key: 'color',
            label: 'Change color',
            icon: <BgColorsOutlined />,
            onClick: handleOpenColorPicker,
        },
        { type: 'divider' as const },
        {
            key: 'archive-all-cards',
            label: 'Archive all cards in this list',
            icon: <InboxOutlined />,
            onClick: () => {
                setMenuOpen(false);
                Modal.confirm({
                    title: 'Archive all cards',
                    content: `Are you sure you want to archive all ${list.cards?.length || 0} cards in "${list.title}"?`,
                    okText: 'Archive all',
                    cancelText: 'Cancel',
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
            label: 'Archive this list',
            icon: <InboxOutlined />,
            onClick: () => {
                setMenuOpen(false);
                Modal.confirm({
                    title: 'Archive list',
                    content: `Are you sure you want to archive "${list.title}"? It will be hidden from the board.`,
                    okText: 'Archive',
                    cancelText: 'Cancel',
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
            label: 'Delete list',
            danger: true,
            icon: <DeleteOutlined />,
            onClick: () => deleteList(list.id),
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
                    backgroundColor: list.color || 'var(--bg-secondary)',
                    borderRadius: 12,
                    padding: '12px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
                {...attributes}
                {...listeners}
                onClick={handleToggleCollapse}
            >
                <ColumnWidthOutlined
                    style={{
                        color: list.color ? '#fff' : 'var(--text-primary)',
                        marginBottom: 12,
                    }}
                />
                <div
                    style={{
                        writingMode: 'vertical-rl',
                        fontWeight: 600,
                        fontSize: 14,
                        color: list.color ? '#fff' : 'var(--text-primary)',
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
                        color: list.color ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    }}
                >
                    {filteredCards.length}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="kanban-list"
        >
            {/* Color Bar - Trello style accent */}
            {list.color && (
                <div
                    className="kanban-list-color-bar"
                    style={{ backgroundColor: list.color }}
                />
            )}
            {/* List Header */}
            <div className="kanban-list-header" {...attributes} {...listeners}>
                {isEditing ? (
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onPressEnter={handleTitleSave}
                        autoFocus
                        size="small"
                    />
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        style={{ cursor: 'pointer', flex: 1 }}
                    >
                        {list.title}
                    </span>
                )}
                <Popover
                    content={colorPickerContent}
                    title="List color"
                    trigger="click"
                    open={colorPickerOpen}
                    onOpenChange={setColorPickerOpen}
                    placement="bottomRight"
                >
                    <span />
                </Popover>
                <Button
                    type="text"
                    size="small"
                    icon={<ColumnWidthOutlined />}
                    onClick={handleToggleCollapse}
                    title="Collapse list"
                />
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['click']}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
            </div>

            {/* Cards */}
            <div className="kanban-list-content">
                <SortableContext
                    items={filteredCards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {filteredCards.map((card) => (
                        <KanbanCard key={card.id} card={card} listId={list.id} />
                    ))}
                </SortableContext>
            </div>

            {/* Add Card */}
            {isAddingCard ? (
                <div style={{ padding: '4px 0' }}>
                    <Input.TextArea
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Enter a title for this card..."
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
                            Add card
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setIsAddingCard(false);
                                setNewCardTitle('');
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddingCard(true)}
                    style={{ width: '100%', textAlign: 'left' }}
                >
                    Add a card
                </Button>
            )}

            {/* Copy List Modal */}
            <Modal
                title="Copy list"
                open={copyModalOpen}
                onOk={handleCopyList}
                onCancel={() => setCopyModalOpen(false)}
                okText="Create list"
                cancelText="Cancel"
            >
                <div style={{ marginBottom: 8 }}>Name</div>
                <Input
                    value={copyTitle}
                    onChange={(e) => setCopyTitle(e.target.value)}
                    placeholder="Enter list name..."
                    autoFocus
                    onPressEnter={handleCopyList}
                />
            </Modal>

            {/* Move All Cards Modal */}
            <Modal
                title="Move all cards in list"
                open={moveModalOpen}
                onOk={() => {
                    if (targetListId) {
                        moveAllCards(list.id, targetListId);
                        setMoveModalOpen(false);
                    }
                }}
                onCancel={() => setMoveModalOpen(false)}
                okText="Move"
                cancelText="Cancel"
                okButtonProps={{ disabled: !targetListId }}
            >
                <div style={{ marginBottom: 8 }}>Select destination list</div>
                <Select
                    value={targetListId || undefined}
                    onChange={setTargetListId}
                    placeholder="Choose a list..."
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
