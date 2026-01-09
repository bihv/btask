'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input, Button, Dropdown } from 'antd';
import { MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { List } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import KanbanCard from './KanbanCard';

interface KanbanListProps {
    list: List;
}

export default function KanbanList({ list }: KanbanListProps) {
    const { updateList, deleteList, createCard } = useBoardStore();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');

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

    const menuItems = [
        {
            key: 'delete',
            label: 'Delete list',
            danger: true,
            onClick: () => deleteList(list.id),
        },
    ];

    return (
        <div ref={setNodeRef} style={style} className="kanban-list">
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
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
            </div>

            {/* Cards */}
            <div className="kanban-list-content">
                <SortableContext
                    items={(list.cards || []).map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {(list.cards || []).map((card) => (
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
        </div>
    );
}
