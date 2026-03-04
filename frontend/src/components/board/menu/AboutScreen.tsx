'use client';

import { useTranslation } from '@/hooks/useLabels';
import { Board, User } from '@/types';
import { useState } from 'react';
import { ScreenHeader } from './MenuShared';

import { Avatar, Button, Divider, Group, Text, Textarea } from '@mantine/core';
import { IconAlignLeft, IconEdit, IconUser } from '@tabler/icons-react';

interface AboutScreenProps {
    board: Board;
    workspaceMembers: (User & { role?: string })[];
    onBack: () => void;
    onUpdateDescription: (description: string) => Promise<void>;
}

export default function AboutScreen({ board, workspaceMembers, onBack, onUpdateDescription }: AboutScreenProps) {
    const t = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [descValue, setDescValue] = useState(board.description || '');
    const [saving, setSaving] = useState(false);

    // Find admin (owner) or fallback to first member
    const admin = workspaceMembers.find(m => m.role === 'owner') || workspaceMembers[0];

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdateDescription(descValue);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={t('UI_ABOUT_THIS_BOARD')} onBack={onBack} />

            {/* Board Admin */}
            <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <IconUser size={16} style={{ opacity: 0.6 }} />
                    <Text fw={700} style={{ fontSize: 12 }}>{t('UI_BOARD_ADMIN')}</Text>
                </div>
                {admin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 24 }}>
                        <Avatar size={32} style={{ backgroundColor: '#0052cc' }}>
                            {admin.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <div>
                            <div><Text fw={700} style={{ fontSize: 13 }}>{admin.full_name || 'Unknown'}</Text></div>
                            <Text c="dimmed" style={{ fontSize: 11 }}>@{admin.email?.split('@')[0]}</Text>
                        </div>
                    </div>
                ) : (
                    <Text c="dimmed" style={{ marginLeft: 24, fontSize: 12 }}>
                        {t('UI_NO_ADMIN_INFO')}
                    </Text>
                )}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Description */}
            <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Group gap={8}>
                        <IconAlignLeft size={16} style={{ opacity: 0.6 }} />
                        <Text fw={700} style={{ fontSize: 12 }}>{t('UI_DESCRIPTION')}</Text>
                    </Group>
                    {!isEditing && (
                        <Button size="sm" leftSection={<IconEdit size={16} />} onClick={() => setIsEditing(true)}>
                            {t('UI_EDIT')}
                        </Button>
                    )}
                </div>
                {isEditing ? (
                    <div style={{ marginLeft: 24 }}>
                        <Textarea
                            value={descValue}
                            onChange={(e) => setDescValue(e.target.value)}
                            rows={3}
                            placeholder={t('UI_PLACEHOLDER_ADD_DESCRIPTION')}
                            autoFocus
                            style={{ marginBottom: 8 }}
                        />
                        <Group>
                            <Button variant="subtle" size="sm" onClick={() => setIsEditing(false)}>
                                {t('UI_CANCEL')}
                            </Button>
                            <Button size="sm" loading={saving} onClick={handleSave}>
                                {t('UI_SAVE')}
                            </Button>
                        </Group>
                    </div>
                ) : (
                    <div style={{ marginLeft: 24 }}>
                        <Text style={{ fontSize: 13, margin: 0 }}>
                            {board.description || t('UI_NO_DESCRIPTION')}
                        </Text>
                    </div>
                )}
            </div>
        </div>
    );
}
