'use client';

import LabelForm, { LABEL_COLORS } from '@/components/shared/LabelForm';
import LabelList from '@/components/shared/LabelList';
import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import api from '@/lib/api';
import { Label } from '@/types';
import { Center, Loader, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ScreenHeader } from './MenuShared';

interface LabelsScreenProps {
    boardId: string;
    onBack: () => void;
}

type View = 'list' | 'create' | 'edit';

export default function LabelsScreen({ boardId, onBack }: LabelsScreenProps) {
    const queryClient = useQueryClient();
    const [view, setView] = useState<View>('list');
    const [labels, setLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form states
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(LABEL_COLORS[0]);

    const t = useTranslation();
    const token = useAppToken();

    const loadLabels = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/boards/${boardId}/labels`);
            if (res.data?.data) {
                setLabels(res.data.data);
            }
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_FETCH_LABELS'), color: 'red' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLabels();
    }, [boardId]);

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

    const handleBackToList = () => {
        resetForm();
        setView('list');
    };

    const handleCreate = async () => {
        setIsSubmitting(true);
        try {
            await api.post(`/boards/${boardId}/labels`, {
                name: name || undefined,
                color,
            });
            await loadLabels();
            queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'labels'] });
            handleBackToList();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_CREATE_LABEL'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLabel) return;
        setIsSubmitting(true);
        try {
            await api.put(`/labels/${editingLabel.id}`, {
                name: name || undefined,
                color,
            });
            await loadLabels();
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            handleBackToList();
            notifications.show({ message: t('SUCCESS_LABEL_UPDATED'), color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_LABEL'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingLabel) return;
        
        modals.openConfirmModal({
            title: t('UI_DELETE_LABEL_CONFIRM_TITLE'),
            centered: true,
            children: (
                <Text size="sm">
                    {t('UI_DELETE_LABEL_CONFIRM_DESC')}
                </Text>
            ),
            labels: { 
                confirm: t('UI_DELETE'), 
                cancel: t('UI_CANCEL') 
            },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                setIsSubmitting(true);
                try {
                    await api.delete(`/labels/${editingLabel.id}`);
                    await loadLabels();
                    queryClient.invalidateQueries({ queryKey: ['boards'] });
                    handleBackToList();
                    notifications.show({ message: t('SUCCESS_LABEL_DELETED'), color: 'green' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: t('ERROR_DELETE_LABEL'), color: 'red' });
                } finally {
                    setIsSubmitting(false);
                }
            },
        });
    };

    if (view === 'list') {
        return (
            <div style={{ width: 280, padding: '0 8px 8px' }}>
                <ScreenHeader title={t('UI_LABELS')} onBack={onBack} />
                
                {isLoading ? (
                    <Center py="xl">
                        <Loader size="sm" />
                    </Center>
                ) : (
                    <LabelList
                        labels={labels}
                        onEditClick={handleStartEdit}
                        onCreateClick={handleStartCreate}
                    />
                )}
            </div>
        );
    }

    // Form View (Create / Edit)
    return (
        <div style={{ width: 280, padding: '0 8px 8px' }}>
            <ScreenHeader 
                title={view === 'create' ? t('UI_CREATE_LABEL') : t('UI_EDIT_LABEL')} 
                onBack={handleBackToList} 
            />

            <LabelForm
                name={name}
                color={color}
                view={view as 'create' | 'edit'}
                isSubmitting={isSubmitting}
                onNameChange={setName}
                onColorChange={setColor}
                onSubmit={view === 'create' ? handleCreate : handleUpdate}
                onDelete={view === 'edit' ? handleDelete : undefined}
            />
        </div>
    );
}
