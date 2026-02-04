'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button, Typography, Spin } from 'antd';
import { AlignLeftOutlined, EditOutlined } from '@ant-design/icons';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Text } = Typography;

interface CardDescriptionSectionProps {
    description: string;
    isEditing: boolean;
    onDescriptionChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onEditStart: () => void;
    workspaceId?: string;
    cardId?: string;
}

export default function CardDescriptionSection({
    description,
    isEditing,
    onDescriptionChange,
    onSave,
    onCancel,
    onEditStart,
    workspaceId,
    cardId,
}: CardDescriptionSectionProps) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlignLeftOutlined />
                    <Text strong>Description</Text>
                </div>
                {!isEditing && description && (
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={onEditStart}
                    >
                        Edit
                    </Button>
                )}
            </div>
            {isEditing ? (
                <div>
                    <RichTextEditor
                        content={description}
                        onChange={onDescriptionChange}
                        editable={true}
                        placeholder="Add a more detailed description..."
                        workspaceId={workspaceId}
                        cardId={cardId}
                    />
                    <div style={{ marginTop: 8 }}>
                        <Button type="primary" size="small" onClick={onSave}>
                            Save
                        </Button>
                        <Button
                            size="small"
                            style={{ marginLeft: 8 }}
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !description && onEditStart()}
                    style={{
                        padding: description ? 0 : 12,
                        background: description ? 'transparent' : 'var(--bg-tertiary)',
                        borderRadius: 8,
                        cursor: description ? 'default' : 'pointer',
                        minHeight: description ? 'auto' : 60,
                    }}
                >
                    {description ? (
                        <RichTextEditor
                            content={description}
                            editable={false}
                        />
                    ) : (
                        <Text type="secondary">Add a more detailed description...</Text>
                    )}
                </div>
            )}
        </div>
    );
}
