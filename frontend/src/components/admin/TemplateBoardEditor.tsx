'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Typography, Space, Popconfirm, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import styles from '@/components/board/views/kanban/KanbanBoard.module.css';
import TemplateCardEditModal from './TemplateCardEditModal';

const { Text } = Typography;

export interface TemplateCardInput {
    id: string;
    title: string;
    description?: string;
    cover_url?: string;
    due_date?: string;
}

export interface TemplateListInput {
    id: string;
    title: string;
    color?: string;
    cards: TemplateCardInput[];
}

interface TemplateBoardEditorProps {
    lists: TemplateListInput[];
    onChange: (lists: TemplateListInput[]) => void;
}

let tempIdCounter = 0;
const generateTempId = () => `temp-${Date.now()}-${tempIdCounter++}`;

export default function TemplateBoardEditor({ lists, onChange }: TemplateBoardEditorProps) {
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingListTitle, setEditingListTitle] = useState('');
    const [addingCardToList, setAddingCardToList] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [newListTitle, setNewListTitle] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [editingCard, setEditingCard] = useState<{ listId: string; card: TemplateCardInput } | null>(null);

    // Add new list
    const handleAddList = () => {
        if (!newListTitle.trim()) return;
        const newList: TemplateListInput = {
            id: generateTempId(),
            title: newListTitle.trim(),
            color: '',
            cards: [],
        };
        onChange([...lists, newList]);
        setNewListTitle('');
        setIsAddingList(false);
    };

    // Update list title
    const handleUpdateListTitle = (listId: string) => {
        if (!editingListTitle.trim()) {
            setEditingListId(null);
            return;
        }
        onChange(lists.map(list => 
            list.id === listId ? { ...list, title: editingListTitle.trim() } : list
        ));
        setEditingListId(null);
    };

    // Update list color
    const handleUpdateListColor = (listId: string, color: string) => {
        onChange(lists.map(list => 
            list.id === listId ? { ...list, color } : list
        ));
    };

    // Delete list
    const handleDeleteList = (listId: string) => {
        onChange(lists.filter(list => list.id !== listId));
    };

    // Add card to list
    const handleAddCard = (listId: string) => {
        if (!newCardTitle.trim()) return;
        const newCard: TemplateCardInput = {
            id: generateTempId(),
            title: newCardTitle.trim(),
        };
        onChange(lists.map(list => 
            list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
        ));
        setNewCardTitle('');
        setAddingCardToList(null);
    };

    // Delete card
    const handleDeleteCard = (listId: string, cardId: string) => {
        onChange(lists.map(list => 
            list.id === listId 
                ? { ...list, cards: list.cards.filter(card => card.id !== cardId) } 
                : list
        ));
    };

    // Update card (from modal)
    const handleUpdateCard = (updatedCard: { id: string; title: string; description?: string; cover_url?: string }) => {
        if (!editingCard) return;
        onChange(lists.map(list => 
            list.id === editingCard.listId 
                ? { 
                    ...list, 
                    cards: list.cards.map(card => 
                        card.id === updatedCard.id 
                            ? { ...card, ...updatedCard } 
                            : card
                    ) 
                } 
                : list
        ));
        setEditingCard(null);
    };

    return (
        <>
        <div style={{ 
            background: 'var(--bg-tertiary)', 
            padding: 16, 
            borderRadius: 8,
            overflowX: 'auto',
        }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 'max-content' }}>
                {lists.map((list) => (
                    <div 
                        key={list.id} 
                        className={styles.list}
                        style={{
                            minWidth: 250,
                            maxWidth: 250,
                            ...(list.color ? { background: `${list.color}a6` } : {}),
                        }}
                    >
                        {/* List Header */}
                        <div className={styles.listHeader} style={list.color ? { color: '#fff' } : undefined}>
                            {editingListId === list.id ? (
                                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                    <Input
                                        size="small"
                                        value={editingListTitle}
                                        onChange={(e) => setEditingListTitle(e.target.value)}
                                        onPressEnter={() => handleUpdateListTitle(list.id)}
                                        autoFocus
                                    />
                                    <Button size="small" icon={<CheckOutlined />} onClick={() => handleUpdateListTitle(list.id)} />
                                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingListId(null)} />
                                </div>
                            ) : (
                                <>
                                    <span 
                                        style={{ flex: 1, cursor: 'pointer' }}
                                        onClick={() => {
                                            setEditingListId(list.id);
                                            setEditingListTitle(list.title);
                                        }}
                                    >
                                        {list.title}
                                    </span>
                                    <ColorPicker
                                        size="small"
                                        value={list.color || '#ffffff'}
                                        onChange={(color) => handleUpdateListColor(list.id, color.toHexString())}
                                    />
                                    <Popconfirm
                                        title="Delete this list?"
                                        onConfirm={() => handleDeleteList(list.id)}
                                        okText="Delete"
                                        okType="danger"
                                    >
                                        <Button 
                                            size="small" 
                                            type="text" 
                                            danger 
                                            icon={<DeleteOutlined />}
                                            style={list.color ? { color: '#fff' } : undefined}
                                        />
                                    </Popconfirm>
                                </>
                            )}
                        </div>

                        {/* Cards */}
                        <div className={styles.listContent}>
                            {list.cards.map((card) => (
                                <div 
                                    key={card.id} 
                                    className={styles.card}
                                    style={{ 
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setEditingCard({ listId: list.id, card })}
                                >
                                    {/* Cover preview */}
                                    {card.cover_url && (
                                        <div style={{ 
                                            height: 80, 
                                            marginBottom: 8,
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            marginTop: -8,
                                            marginLeft: -8,
                                            marginRight: -8,
                                        }}>
                                            <img 
                                                src={card.cover_url} 
                                                alt="cover" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 13 }}>{card.title}</Text>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <Button 
                                                size="small" 
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCard({ listId: list.id, card });
                                                }}
                                            />
                                            <Button 
                                                size="small" 
                                                type="text" 
                                                danger 
                                                icon={<DeleteOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCard(list.id, card.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Card */}
                        {addingCardToList === list.id ? (
                            <div style={{ padding: '4px 0' }}>
                                <Input.TextArea
                                    value={newCardTitle}
                                    onChange={(e) => setNewCardTitle(e.target.value)}
                                    placeholder="Enter card title..."
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddCard(list.id);
                                        }
                                        if (e.key === 'Escape') {
                                            setAddingCardToList(null);
                                            setNewCardTitle('');
                                        }
                                    }}
                                />
                                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                    <Button type="primary" size="small" onClick={() => handleAddCard(list.id)}>
                                        Add card
                                    </Button>
                                    <Button size="small" onClick={() => { setAddingCardToList(null); setNewCardTitle(''); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={() => setAddingCardToList(list.id)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    ...(list.color ? { color: '#fff' } : {}),
                                }}
                            >
                                Add a card
                            </Button>
                        )}
                    </div>
                ))}

                {/* Add List */}
                {isAddingList ? (
                    <div className={styles.list} style={{ minWidth: 250, maxWidth: 250 }}>
                        <Input
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="Enter list title..."
                            onPressEnter={handleAddList}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsAddingList(false);
                                    setNewListTitle('');
                                }
                            }}
                            autoFocus
                        />
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <Button type="primary" size="small" onClick={handleAddList}>
                                Add list
                            </Button>
                            <Button size="small" onClick={() => { setIsAddingList(false); setNewListTitle(''); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddingList(true)}
                        style={{ minWidth: 250, height: 48 }}
                    >
                        Add another list
                    </Button>
                )}
            </div>
        </div>

            {/* Card Edit Modal */}
            <TemplateCardEditModal
                open={!!editingCard}
                card={editingCard?.card || null}
                onSave={handleUpdateCard}
                onCancel={() => setEditingCard(null)}
            />
        </>
    );
}
