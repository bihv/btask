'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Tooltip, Tag } from 'antd';
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    CommentOutlined, 
    CheckSquareOutlined,
    CalendarOutlined,
    NumberOutlined,
    FontSizeOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { Card, CustomField, CardCustomFieldValue } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import styles from './KanbanBoard.module.css';
import UserAvatar from '@/components/common/UserAvatar';
import { isDueSoon, isOverdue, formatDueDate } from '@/components/common/DueDateTag';

const { Text } = Typography;

interface KanbanCardProps {
    card: Card;
    listId: string;
    readOnly?: boolean;
    showCovers?: boolean; // Optional override for showCardCovers
    onCardClick?: (card: Card) => void; // Custom click handler for readOnly mode
}

export default function KanbanCard({ card, listId, readOnly = false, showCovers, onCardClick }: KanbanCardProps) {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const showCardCoversFromStore = useBoardStore((state) => state.showCardCovers);
    const currentBoard = useBoardStore((state) => state.currentBoard);
    const showCardCovers = showCovers ?? showCardCoversFromStore;

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
        disabled: readOnly,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
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
        if (readOnly && onCardClick) {
            onCardClick(card);
            return;
        }
        if (readOnly) return;
        // Navigate to separate card page
        router.push(`/boards/${boardId}/cards/${card.id}`);
    };

    // Render custom field value from card's custom_field_values
    // Each value has custom_field nested inside with show_on_card flag
    const renderCustomFieldTags = () => {
        if (!card.custom_field_values || card.custom_field_values.length === 0) {
            return null;
        }

        return card.custom_field_values
            .filter(cfv => cfv.custom_field?.show_on_card)
            .map(cfv => {
                const field = cfv.custom_field;
                if (!field) return null;

                // Common badge style
                const badgeStyle = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: 'var(--bg-tertiary)',
                };

                switch (field.type) {
                    case 'checkbox':
                        if (cfv.value === 'true') {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'dropdown':
                        if (cfv.option) {
                            return (
                                <div 
                                    key={cfv.id} 
                                    style={{
                                        ...badgeStyle,
                                        backgroundColor: cfv.option.color || 'var(--bg-tertiary)',
                                    }}
                                >
                                    <AppstoreOutlined style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-secondary)',
                                        fontSize: 12,
                                    }} />
                                    <span style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-secondary)',
                                    }}>
                                        {field.name}:
                                    </span>
                                    <span style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-primary)',
                                        fontWeight: 500,
                                    }}>
                                        {cfv.option.value}
                                    </span>
                                </div>
                            );
                        }
                        return null;

                    case 'text':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <FontSizeOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{cfv.value}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'number':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <NumberOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{cfv.value}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'date':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <CalendarOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>
                                        {new Date(cfv.value).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        }
                        return null;

                    default:
                        return null;
                }
            })
            .filter(Boolean);
    };

    const customFieldTags = renderCustomFieldTags();

    return (
        <div
            ref={readOnly ? undefined : setNodeRef}
            style={readOnly ? { cursor: 'default' } : style}
            className={styles.card}
            onClick={handleCardClick}
            {...(readOnly ? {} : attributes)}
            {...(readOnly ? {} : listeners)}
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
                            objectPosition: `center ${card.cover_image_y ?? 50}%`,
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

            {/* Custom Fields */}
            {customFieldTags && customFieldTags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {customFieldTags}
                </div>
            )}

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
                    <div style={{ display: 'flex', marginLeft: 'auto' }}>
                        {card.members.slice(0, 3).map((cm) => (
                            <Tooltip key={cm.id} title={cm.user?.full_name}>
                                <div style={{ marginLeft: -4 }}>
                                    <UserAvatar
                                        avatarUrl={cm.user?.avatar_url}
                                        name={cm.user?.full_name}
                                        size="small"
                                    />
                                </div>
                            </Tooltip>
                        ))}
                        {card.members.length > 3 && (
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: '#0052cc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                color: 'white',
                                marginLeft: -4,
                            }}>
                                +{card.members.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
