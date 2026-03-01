'use client';

import React, { useState, useMemo } from 'react';
import KanbanBoard from '@/components/board/views/kanban/KanbanBoard';
import TemplateCardModal from './TemplateCardModal';
import { TemplateList, TemplateCard, BoardList, Card } from '@/types';
import { useAppToken } from '@/hooks/useAppToken';

import { Text, Title } from '@mantine/core';
interface BoardPreviewProps {
    lists: TemplateList[];
    title?: string;
    backgroundColor?: string;
    backgroundImage?: string;
}

// Convert TemplateList to List type for KanbanBoard
function convertToLists(templateLists: TemplateList[], fallbackColor: string): BoardList[] {
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
        cards: (list.cards || []).map((card, cardIndex) => ({
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
            // Link preview fields
            link_url: card.link_url,
            link_title: card.link_title,
            link_description: card.link_description,
            link_image: card.link_image,
            link_site_name: card.link_site_name,
            link_favicon: card.link_favicon,
            // Add some mock labels for visual variety
            labels: [{
                id: `label-${card.id}`,
                card_id: card.id,
                label_id: `label-${list.id}`,
                label: {
                    id: `label-${list.id}`,
                    board_id: 'template',
                    color: list.color || fallbackColor,
                },
            }],
        } as Card)),
    }));
}

export default function BoardPreview({ lists, title, backgroundColor = '#0079bf', backgroundImage }: BoardPreviewProps) {
    const token = useAppToken();
    const convertedLists = useMemo(() => convertToLists(lists, token.colorPrimary), [lists, token.colorPrimary]);
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
                            background: token.colorOverlayDark,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Text fw={700} style={{ color: token.colorWhite, fontSize: '14px' }}>{title}</Text>
                        <span
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                color: token.colorWhite,
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
                        maxHeight: '500px',
                        overflowX: 'auto',
                        overflowY: 'auto',
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
