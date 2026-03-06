'use client';

import { useTranslation } from '@/hooks/useLabels';
import dynamic from 'next/dynamic';

import { Button, Loader, Text } from '@mantine/core';
import { IconAlignLeft, IconEdit } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

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
                    <IconAlignLeft size={16} />
                    <Text fw={700}>{t('UI_DESCRIPTION')}</Text>
                </div>
                {!isEditing && description && (
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconEdit size={16} />}
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
                        minHeight={200}
                    />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <Button
                            size="sm"
                            onClick={onCancel}
                            variant="subtle"
                        >
                            {t('UI_CANCEL')}
                        </Button>
                        <Button size="sm" onClick={onSave}>
                            {t('UI_SAVE')}
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
                        minHeight: description ? 'auto' : 200,
                    }}
                >
                    {description ? (
                        <RichTextEditor
                            content={description}
                            editable={false}
                        />
                    ) : (
                        <Text c="dimmed">{t('UI_PLACEHOLDER_DESCRIPTION')}</Text>
                    )}
                </div>
            )}
        </div>
    );
}
