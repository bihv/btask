'use client';

import React, { useState, useMemo } from 'react';
import { Typography } from 'antd';
import KanbanBoard from '@/components/board/views/kanban/KanbanBoard';
import TemplateCardModal from './TemplateCardModal';
import { TemplateList } from '@/app/(dashboard)/templates/data';
import { List, Card } from '@/types';

const { Text } = Typography;

interface BoardPreviewProps {
    lists: TemplateList[];
    title?: string;
    backgroundColor?: string;
    backgroundImage?: string;
}

// Convert TemplateList to List type for KanbanBoard
function convertToLists(templateLists: TemplateList[]): List[] {
    const now = new Date().toISOString();
    return templateLists.map((list, listIndex) => ({
        id: list.id,
        board_id: 'template',
        title: list.title,
        position: listIndex,
        color: list.color,
        is_archived: false,
        is_collapsed: false,
        created_at: now,
        updated_at: now,
        cards: list.cards.map((card, cardIndex) => ({
            id: card.id,
            list_id: list.id,
            title: card.title,
            description: card.description,
            position: cardIndex,
            is_completed: false,
            due_date: card.due_date,
            cover_color: card.cover_url, // Use cover_color to store cover URL for modal
            cover_image: card.cover_url, // Map for KanbanCard display
            created_by: 'template',
            created_at: now,
            updated_at: now,
            // Add some mock labels for visual variety
            labels: [{ 
                id: `label-${card.id}`,
                card_id: card.id,
                label_id: `label-${list.id}`,
                label: {
                    id: `label-${list.id}`,
                    board_id: 'template',
                    color: list.color || '#579dff',
                },
            }],
        } as Card)),
    }));
}

export default function BoardPreview({ lists, title, backgroundColor = '#0079bf', backgroundImage }: BoardPreviewProps) {
    const convertedLists = useMemo(() => convertToLists(lists), [lists]);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Find the list title for the selected card
    const selectedListTitle = useMemo(() => {
        if (!selectedCard) return undefined;
        const list = convertedLists.find(l => l.id === selectedCard.list_id);
        return list?.title;
    }, [selectedCard, convertedLists]);

    const handleCardClick = (card: Card) => {
        setSelectedCard(card);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCard(null);
    };

    return (
        <>
            <div
                style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: backgroundImage
                        ? `url(${backgroundImage}) center/cover`
                        : backgroundColor,
                }}
            >
                {/* Board header bar */}
                {title && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Text strong style={{ color: '#fff', fontSize: '14px' }}>{title}</Text>
                        <span
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                color: '#fff',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: 600,
                            }}
                        >
                            Template
                        </span>
                    </div>
                )}

                {/* Board content using KanbanBoard with readOnly mode */}
                <div
                    style={{
                        height: 'auto',
                        minHeight: '280px',
                        maxHeight: '400px',
                        overflow: 'hidden',
                    }}
                >
                    <KanbanBoard 
                        readOnly={true} 
                        listsData={convertedLists} 
                        onCardClick={handleCardClick}
                        showCovers={true}
                    />
                </div>
            </div>

            {/* Card Detail Modal */}
            <TemplateCardModal
                card={selectedCard}
                open={modalOpen}
                onClose={handleCloseModal}
                listTitle={selectedListTitle}
            />
        </>
    );
}
