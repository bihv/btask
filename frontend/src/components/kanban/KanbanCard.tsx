'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Avatar, Tooltip } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CommentOutlined } from '@ant-design/icons';
import { Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import styles from './KanbanBoard.module.css';

const { Text } = Typography;

interface KanbanCardProps {
    card: Card;
    listId: string;
}

export default function KanbanCard({ card, listId }: KanbanCardProps) {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const showCardCovers = useBoardStore((state) => state.showCardCovers);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: 'card',
            card,
            listId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const formatDueDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isDueSoon = (date: string) => {
        const dueDate = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 3 && diffDays >= 0;
    };

    const isOverdue = (date: string) => {
        return new Date(date) < new Date();
    };

    const getDueDateStatus = () => {
        if (!card.due_date) return null;
        if (card.is_completed) return { color: '#61bd4f', text: 'Complete', textColor: 'white' };
        if (isOverdue(card.due_date)) return { color: '#eb5a46', text: 'Overdue', textColor: 'white' };
        if (isDueSoon(card.due_date)) return { color: '#f2d600', text: 'Due soon', textColor: '#172b4d' };
        return { color: 'transparent', text: '', textColor: 'inherit' };
    };

    const dueDateStatus = getDueDateStatus();

    const handleCardClick = () => {
        // Navigate to separate card page
        router.push(`/boards/${boardId}/cards/${card.id}`);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={styles.card}
            onClick={handleCardClick}
            {...attributes}
            {...listeners}
        >
            {/* Cover Image */}
            {showCardCovers && card.cover_image && (
                <div
                    style={{
                        height: 120,
                        marginBottom: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                        marginTop: -8,
                        marginLeft: -8,
                        marginRight: -8,
                        width: 'calc(100% + 16px)',
                    }}
                >
                    <img
                        src={card.cover_image}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div className={styles.cardLabels}>
                    {card.labels.map((cl) => (
                        <div
                            key={cl.id}
                            className={styles.cardLabel}
                            style={{ backgroundColor: cl.label?.color }}
                        />
                    ))}
                </div>
            )}

            {/* Title */}
            <Text style={{ fontSize: 14 }}>{card.title}</Text>

            {/* Footer */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                }}
            >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {card.due_date && dueDateStatus && (
                        <Tooltip title={`${formatDueDate(card.due_date)}${dueDateStatus.text ? ` • ${dueDateStatus.text}` : ''}`}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    backgroundColor: dueDateStatus.color,
                                    color: dueDateStatus.textColor,
                                }}
                            >
                                {card.is_completed ? (
                                    <CheckCircleOutlined style={{ fontSize: 10 }} />
                                ) : (
                                    <ClockCircleOutlined style={{ fontSize: 10 }} />
                                )}
                                {formatDueDate(card.due_date)}
                            </div>
                        </Tooltip>
                    )}

                    {card.comments && card.comments.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                            }}
                        >
                            <CommentOutlined style={{ fontSize: 12 }} />
                            {card.comments.length}
                        </div>
                    )}
                </div>

                {/* Members */}
                {card.members && card.members.length > 0 && (
                    <Avatar.Group
                        maxCount={3}
                        size="small"
                        maxStyle={{ backgroundColor: '#0052cc' }}
                    >
                        {card.members.map((cm) => (
                            <Tooltip key={cm.id} title={cm.user?.full_name}>
                                <Avatar
                                    size="small"
                                    style={{ backgroundColor: '#0052cc' }}
                                >
                                    {cm.user?.full_name?.charAt(0).toUpperCase()}
                                </Avatar>
                            </Tooltip>
                        ))}
                    </Avatar.Group>
                )}
            </div>
        </div>
    );
}
