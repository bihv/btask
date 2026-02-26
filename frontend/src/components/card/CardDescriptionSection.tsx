'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button, Typography, Spin } from 'antd';
import { AlignLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useLabels';

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
    const t = useTranslation();
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlignLeftOutlined />
                    <Text strong>{t('UI_DESCRIPTION')}</Text>
                </div>
                {!isEditing && description && (
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={onEditStart}
                    >
                        {t('UI_EDIT')}
                    </Button>
                )}
            </div>
            {isEditing ? (
                <div>
                    <RichTextEditor
                        content={description}
                        onChange={onDescriptionChange}
                        editable={true}
                        placeholder={t('UI_PLACEHOLDER_DESCRIPTION')}
                        workspaceId={workspaceId}
                        cardId={cardId}
                    />
                    <div style={{ marginTop: 8 }}>
                        <Button type="primary" size="small" onClick={onSave}>
                            {t('UI_SAVE')}
                        </Button>
                        <Button
                            size="small"
                            style={{ marginLeft: 8 }}
                            onClick={onCancel}
                        >
                            {t('UI_CANCEL')}
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
                        <Text type="secondary">{t('UI_PLACEHOLDER_DESCRIPTION')}</Text>
                    )}
                </div>
            )}
        </div>
    );
}
