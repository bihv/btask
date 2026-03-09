'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import api from '@/lib/api';
import { Label } from '@/types';
import React, { useState } from 'react';

import LabelForm, { LABEL_COLORS } from '@/components/shared/LabelForm';
import LabelList from '@/components/shared/LabelList';
import { Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';

interface LabelPickerProps {
    boardId: string;
    labels: Label[];
    selectedLabelIds: string[];
    onToggle: (labelId: string) => void;
    onRefresh: () => void;
    onCardRefresh?: () => void;  // To refresh card data after label changes
}

type View = 'list' | 'create' | 'edit';

export default function LabelPicker({
    boardId,
    labels,
    selectedLabelIds,
    onToggle,
    onRefresh,
    onCardRefresh,
}: LabelPickerProps) {
    const [view, setView] = useState<View>('list');
    const t = useTranslation();
    const token = useAppToken();
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [color, setColor] = useState(LABEL_COLORS[0]);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setColor(LABEL_COLORS[0]);
        setEditingLabel(null);
    };

    const handleStartCreate = () => {
        resetForm();
        setView('create');
    };

    const handleStartEdit = (label: Label, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLabel(label);
        setName(label.name || '');
        setColor(label.color);
        setView('edit');
    };

    const handleBack = () => {
        resetForm();
        setView('list');
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            await api.post(`/boards/${boardId}/labels`, {
                name: name || undefined,
                color,
            });
            onRefresh();
            handleBack();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_CREATE_LABEL'), color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLabel) return;
        setLoading(true);
        try {
            await api.put(`/labels/${editingLabel.id}`, {
                name: name || undefined,
                color,
            });
            onRefresh();
            onCardRefresh?.();  // Refresh card to show updated label
            handleBack();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_LABEL'), color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingLabel) return;
        setLoading(true);
        try {
            await api.delete(`/labels/${editingLabel.id}`);
            onRefresh();
            onCardRefresh?.();  // Refresh card to remove deleted label
            handleBack();
            notifications.show({ message: t('SUCCESS_LABEL_DELETED'), color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_DELETE_LABEL'), color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // List View
    if (view === 'list') {
        return (
            <div style={{ width: 280 }}>
                <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>{t('UI_LABELS')}</Text>
                <LabelList
                    labels={labels}
                    selectedLabelIds={selectedLabelIds}
                    onToggle={onToggle}
                    onEditClick={handleStartEdit}
                    onCreateClick={handleStartCreate}
                />
            </div>
        );
    }

    // Create/Edit View
    return (
        <div style={{ width: 280 }}>
            {/* Header with back button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Button
                    variant="subtle"
                    size="sm"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={handleBack}
                />
                <Text fw={700}>{view === 'create' ? t('UI_CREATE_LABEL') : t('UI_EDIT_LABEL')}</Text>
            </div>

            <LabelForm
                name={name}
                color={color}
                view={view as 'create' | 'edit'}
                isSubmitting={loading}
                onNameChange={setName}
                onColorChange={setColor}
                onSubmit={view === 'create' ? handleCreate : handleUpdate}
                onDelete={view === 'edit' ? handleDelete : undefined}
            />
        </div>
    );
}
