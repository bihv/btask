'use client';

import KanbanBoard from '@/components/board/views/kanban/KanbanBoard';
import styles from '@/components/board/views/kanban/KanbanBoard.module.css';
import api from '@/lib/api';
import { BoardList, Card } from '@/types';
import { useCallback, useState } from 'react';
import TemplateCardEditModal from './TemplateCardEditModal';

import { Button, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
export interface TemplateCardInput {
    id: string;
    title: string;
    description?: string;
    cover_url?: string;
    due_date?: string;
    // Link preview fields
    link_url?: string;
    link_title?: string;
    link_description?: string;
    link_image?: string;
    link_site_name?: string;
    link_favicon?: string;
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

// Helper to check if string is a URL
const isURL = (str: string): boolean => {
    const trimmed = str.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return false;
    }
    try {
        new URL(trimmed);
        return true;
    } catch {
        return false;
    }
};

export default function TemplateBoardEditor({ lists, onChange }: TemplateBoardEditorProps) {
    const [newListTitle, setNewListTitle] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);

    // Convert TemplateListInput to BoardList for compatibility
    const boardLists: BoardList[] = lists.map(list => ({
        ...list,
        position: 0,
        board_id: 'template',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cards: list.cards.map(card => ({
            id: card.id,
            title: card.title,
            description: card.description,
            cover_image: card.cover_url?.startsWith('http') ? card.cover_url : undefined,
            cover_color: card.cover_url && !card.cover_url.startsWith('http') ? card.cover_url : undefined,
            due_date: card.due_date,
            link_url: card.link_url,
            link_title: card.link_title,
            link_description: card.link_description,
            link_image: card.link_image,
            link_site_name: card.link_site_name,
            link_favicon: card.link_favicon,
            list_id: list.id,
            position: 0,
            board_id: 'template',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_completed: false,
            created_by: '',
        }))
    }));

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

    // Delete card from template
    const handleDeleteCard = (cardId: string) => {
        onChange(lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== cardId)
        })));
    };

    // Add card to list (for template)
    const handleAddCard = async (listId: string, title: string) => {
        const trimmed = title.trim();
        if (!trimmed) return;

        let newCard: TemplateCardInput = {
            id: generateTempId(),
            title: trimmed,
        };

        // If title is a URL, fetch link preview first
        if (isURL(trimmed)) {
            try {
                const response = await api.post('/link-preview', { url: trimmed });
                const preview = response.data.data; // Data is nested in response.data.data
                if (preview) {
                    newCard.link_url = preview.url || trimmed;
                    newCard.link_title = preview.title;
                    newCard.link_description = preview.description;
                    newCard.link_image = preview.image;
                    newCard.link_site_name = preview.site_name;
                    newCard.link_favicon = preview.favicon;
                }
            } catch (error) {
                console.error('Failed to fetch link preview:', error);
                // Even if fetch fails, still add the card with URL as title
            }
        }

        // Add card after preview fetch completes
        const updatedLists = lists.map(list =>
            list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
        );
        onChange(updatedLists);
    };

    // Handle lists change from board
    const handleListsChange = useCallback((updatedBoardLists: BoardList[]) => {
        const updatedLists: TemplateListInput[] = updatedBoardLists.map(list => ({
            id: list.id,
            title: list.title,
            color: list.color,
            cards: (list.cards || []).map(card => ({
                id: card.id,
                title: card.title,
                description: card.description,
                cover_url: card.cover_image || card.cover_color,
                due_date: card.due_date,
                link_url: card.link_url,
                link_title: card.link_title,
                link_description: card.link_description,
                link_image: card.link_image,
                link_site_name: card.link_site_name,
                link_favicon: card.link_favicon,
            }))
        }));
        onChange(updatedLists);
    }, [onChange]);

    // Handle card click to open edit modal
    const handleCardClick = (card: Card) => {
        setEditingCard(card);
    };

    // Update card from modal
    const handleUpdateCard = (updatedCard: { id: string; title: string; description?: string; cover_url?: string }) => {
        if (!editingCard) return;

        onChange(lists.map(list => ({
            ...list,
            cards: list.cards.map(card =>
                card.id === updatedCard.id
                    ? { ...card, ...updatedCard }
                    : card
            )
        })));
        setEditingCard(null);
    };

    return (
        <>
            <div style={{
                background: 'var(--bg-tertiary)',
                padding: 16,
                borderRadius: 8,
            }}>
                <div style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    alignItems: 'flex-start'
                }}>
                    <KanbanBoard
                        listsData={boardLists}
                        onListsChange={handleListsChange}
                        onCardClick={handleCardClick}
                        onAddCard={handleAddCard}
                        onDeleteCard={handleDeleteCard}
                        readOnly={false}
                        showCovers={true}
                    />

                    {/* Add List Section */}
                    {isAddingList ? (
                        <div className={styles.list} style={{ minWidth: 250, maxWidth: 250, flexShrink: 0 }}>
                            <TextInput
                                value={newListTitle}
                                onChange={(e) => setNewListTitle(e.target.value)}
                                placeholder="Enter list title..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsAddingList(false);
                                        setNewListTitle('');
                                    }
                                }}
                                autoFocus
                            />
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <Button variant="subtle" size="sm" onClick={() => { setIsAddingList(false); setNewListTitle(''); }}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleAddList}>
                                    Add list
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="default"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setIsAddingList(true)}
                            style={{ minWidth: 250, height: 48, flexShrink: 0 }}
                        >
                            Add another list
                        </Button>
                    )}
                </div>
            </div>

            {/* Card Edit Modal */}
            <TemplateCardEditModal
                open={!!editingCard}
                card={editingCard ? {
                    id: editingCard.id,
                    title: editingCard.title,
                    description: editingCard.description,
                    cover_url: editingCard.cover_image || editingCard.cover_color || '',
                } : null}
                onCancel={() => setEditingCard(null)}
                onSave={handleUpdateCard}
            />
        </>
    );
}
