'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Avatar, Tooltip } from 'antd';
import { ClockCircleOutlined, CommentOutlined } from '@ant-design/icons';
import { Card } from '@/types';

const { Text } = Typography;

interface KanbanCardProps {
    card: Card;
    listId: string;
}

export default function KanbanCard({ card, listId }: KanbanCardProps) {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;

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
        return diffDays <= 1 && diffDays >= 0;
    };

    const isOverdue = (date: string) => {
        return new Date(date) < new Date();
    };

    const handleCardClick = () => {
        // Navigate to separate card page
        router.push(`/boards/${boardId}/cards/${card.id}`);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="kanban-card"
            onClick={handleCardClick}
            {...attributes}
            {...listeners}
        >
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div className="card-labels">
                    {card.labels.map((cl) => (
                        <div
                            key={cl.id}
                            className="card-label"
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
                    {card.due_date && (
                        <Tooltip title={formatDueDate(card.due_date)}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    backgroundColor: card.is_completed
                                        ? '#61bd4f'
                                        : isOverdue(card.due_date)
                                            ? '#eb5a46'
                                            : isDueSoon(card.due_date)
                                                ? '#f2d600'
                                                : 'transparent',
                                    color: card.is_completed || isOverdue(card.due_date)
                                        ? 'white'
                                        : 'inherit',
                                }}
                            >
                                <ClockCircleOutlined style={{ fontSize: 10 }} />
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
