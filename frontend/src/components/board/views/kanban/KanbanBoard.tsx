'use client';

import React, { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoardStore } from '@/stores/boardStore';
import { Card, BoardList } from '@/types';
import { FilterState } from '@/components/board/BoardFilterPopover';
import KanbanList from './KanbanList';
import KanbanCard from './KanbanCard';
import AddList from './AddList';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
    filters?: FilterState;
    readOnly?: boolean;
    listsData?: BoardList[]; // Optional: use this instead of store lists when provided
    onCardClick?: (card: Card) => void; // Custom click handler for cards
    showCovers?: boolean; // Force show covers
}

export default function KanbanBoard({ filters, readOnly = false, listsData, onCardClick, showCovers }: KanbanBoardProps) {
    const { lists: storeLists, currentBoard, moveCard, moveList, optimisticMoveCard } =
        useBoardStore();
    const lists = listsData ?? storeLists;
    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const [activeList, setActiveList] = useState<BoardList | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeData = active.data.current;

        if (activeData?.type === 'card') {
            setActiveCard(activeData.card);
            setActiveList(null);
        } else if (activeData?.type === 'list') {
            setActiveList(activeData.list);
            setActiveCard(null);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type !== 'card') return;

        const activeCardId = active.id as string;
        const activeListId = activeData.listId;

        let overListId: string;
        let overIndex: number;

        if (overData?.type === 'card') {
            overListId = overData.listId;
            const overList = lists.find((l) => l.id === overListId);
            overIndex = overList?.cards?.findIndex((c) => c.id === over.id) ?? 0;
        } else if (overData?.type === 'list') {
            overListId = over.id as string;
            const overList = lists.find((l) => l.id === overListId);
            overIndex = overList?.cards?.length ?? 0;
        } else {
            return;
        }

        // Skip if dropping on itself
        if (activeCardId === over.id) return;

        optimisticMoveCard(activeCardId, activeListId, overListId, overIndex);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);
        setActiveList(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === 'card') {
            let overListId: string;
            let overIndex: number;

            if (overData?.type === 'card') {
                overListId = overData.listId;
                const overList = lists.find((l) => l.id === overListId);
                overIndex = overList?.cards?.findIndex((c) => c.id === over.id) ?? 0;
            } else if (overData?.type === 'list') {
                overListId = over.id as string;
                const overList = lists.find((l) => l.id === overListId);
                overIndex = overList?.cards?.length ?? 0;
            } else {
                return;
            }

            moveCard(active.id as string, overListId, overIndex);
        } else if (activeData?.type === 'list') {
            const oldIndex = lists.findIndex((l) => l.id === active.id);
            const newIndex = lists.findIndex((l) => l.id === over.id);

            if (oldIndex !== newIndex && newIndex !== -1) {
                moveList(active.id as string, newIndex);
            }
        }
    };

    return (
        <DndContext
            sensors={readOnly ? [] : sensors}
            collisionDetection={closestCorners}
            onDragStart={readOnly ? undefined : handleDragStart}
            onDragOver={readOnly ? undefined : handleDragOver}
            onDragEnd={readOnly ? undefined : handleDragEnd}
        >
            <div className={styles.board}>
                <SortableContext
                    items={lists.map((l) => l.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    {lists.map((list) => (
                        <KanbanList 
                            key={list.id} 
                            list={list} 
                            filters={filters} 
                            readOnly={readOnly} 
                            onCardClick={onCardClick} 
                            showCovers={showCovers}
                        />
                    ))}
                </SortableContext>

                {!readOnly && <AddList boardId={currentBoard?.id || ''} />}
            </div>

            <DragOverlay>
                {activeCard && (
                    <div className={`${styles.card} ${styles.cardDragging}`}>
                        <KanbanCard card={activeCard} listId="" />
                    </div>
                )}
                {activeList && (
                    <div className={styles.list} style={{ opacity: 0.9 }}>
                        <div className={styles.listHeader}>
                            <span>{activeList.title}</span>
                        </div>
                        <div className={styles.listContent}>
                            {(activeList.cards || []).slice(0, 3).map((card) => (
                                <div key={card.id} className={styles.card}>
                                    {card.title}
                                </div>
                            ))}
                            {(activeList.cards?.length || 0) > 3 && (
                                <div style={{ padding: 8, color: '#666', fontSize: 12 }}>
                                    +{(activeList.cards?.length || 0) - 3} more cards
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
