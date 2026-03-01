'use client';

import React from 'react';
import { Card } from '@/types';
import { formatDueDate } from '@/components/common/DueDateTag';
import dynamic from 'next/dynamic';

import { Modal, Text, Title, Divider, Badge, Group, Loader } from '@mantine/core';
import { IconClock, IconTag, IconFileText, IconPhoto } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

interface TemplateCardModalProps {
    card: Card | null;
    open: boolean;
    onClose: () => void;
    listTitle?: string;
}

export default function TemplateCardModal({ card, open, onClose, listTitle }: TemplateCardModalProps) {
    if (!card) return null;

    // Check if description looks like BlockNote JSON
    const isRichDescription = card.description?.startsWith('[');

    return (
        <Modal
            opened={open}
            onClose={onClose}
            size={600}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconFileText size={16}  />
                    <span>{card.title}</span>
                </div>
            }
        >
            {/* Cover Image */}
            {card.cover_color && card.cover_color.startsWith('http') && (
                <div style={{ 
                    marginBottom: 16,
                    marginTop: -4,
                    marginLeft: -24,
                    marginRight: -24,
                    borderRadius: 0,
                    overflow: 'hidden',
                }}>
                    <img 
                        src={card.cover_color} 
                        alt="Cover" 
                        style={{ 
                            width: '100%', 
                            maxHeight: 200, 
                            objectFit: 'cover' 
                        }} 
                    />
                </div>
            )}

            {/* List name */}
            {listTitle && (
                <div style={{ marginBottom: 16 }}>
                    <Text c="dimmed">in list </Text>
                    <Badge color="blue">{listTitle}</Badge>
                </div>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <Text fw={700} style={{ marginBottom: 8, display: 'block' }}>
                        <IconTag size={16} style={{ marginRight: 8 }}  />
                        Labels
                    </Text>
                    <Group wrap="wrap">
                        {card.labels.map((cl) => (
                            <Badge
                                key={cl.id}
                                color={cl.label?.color}
                                style={{ minWidth: 40, height: 24 }}
                            >
                                {cl.label?.name || ''}
                            </Badge>
                        ))}
                    </Group>
                </div>
            )}

            {/* Due Date */}
            {card.due_date && (
                <div style={{ marginBottom: 16 }}>
                    <Text fw={700} style={{ marginBottom: 8, display: 'block' }}>
                        <IconClock size={16} style={{ marginRight: 8 }}  />
                        Due Date
                    </Text>
                    <Badge color={card.is_completed ? 'green' : 'default'}>
                        {formatDueDate(card.due_date)}
                    </Badge>
                </div>
            )}

            <Divider />

            {/* Description */}
            <div>
                <Text fw={700} style={{ marginBottom: 8, display: 'block' }}>Description</Text>
                {card.description ? (
                    isRichDescription ? (
                        <RichTextEditor
                            content={card.description}
                            editable={false}
                        />
                    ) : (
                        <Text c="dimmed">{card.description}</Text>
                    )
                ) : (
                    <Text c="dimmed">
                        This card is part of the template. Add a description when you use this template.
                    </Text>
                )}
            </div>

            <Divider />

            {/* Template notice */}
            <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: 12, 
                borderRadius: 8,
                textAlign: 'center'
            }}>
                <Text c="dimmed" style={{ fontSize: 12 }}>
                    This is a preview. Click "Use template" to create a real board with this card.
                </Text>
            </div>
        </Modal>
    );
}
