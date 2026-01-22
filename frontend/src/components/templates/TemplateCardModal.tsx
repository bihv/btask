'use client';

import React from 'react';
import { Modal, Typography, Divider, Tag, Space, Spin } from 'antd';
import { ClockCircleOutlined, TagOutlined, FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import { Card } from '@/types';
import { formatDueDate } from '@/components/common/DueDateTag';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Text, Paragraph } = Typography;

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
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined />
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
                    <Text type="secondary">in list </Text>
                    <Tag color="blue">{listTitle}</Tag>
                </div>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                        <TagOutlined style={{ marginRight: 8 }} />
                        Labels
                    </Text>
                    <Space wrap>
                        {card.labels.map((cl) => (
                            <Tag
                                key={cl.id}
                                color={cl.label?.color}
                                style={{ minWidth: 40, height: 24 }}
                            >
                                {cl.label?.name || ''}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}

            {/* Due Date */}
            {card.due_date && (
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Due Date
                    </Text>
                    <Tag color={card.is_completed ? 'green' : 'default'}>
                        {formatDueDate(card.due_date)}
                    </Tag>
                </div>
            )}

            <Divider />

            {/* Description */}
            <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>Description</Text>
                {card.description ? (
                    isRichDescription ? (
                        <RichTextEditor
                            content={card.description}
                            editable={false}
                        />
                    ) : (
                        <Paragraph type="secondary">{card.description}</Paragraph>
                    )
                ) : (
                    <Paragraph type="secondary">
                        This card is part of the template. Add a description when you use this template.
                    </Paragraph>
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
                <Text type="secondary" style={{ fontSize: 12 }}>
                    This is a preview. Click "Use template" to create a real board with this card.
                </Text>
            </div>
        </Modal>
    );
}
