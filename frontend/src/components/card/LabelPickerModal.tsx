'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/types';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Modal, TextInput, Button, Text, Title, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEdit, IconTrash, IconArrowLeft } from '@tabler/icons-react';
const LABEL_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface LabelPickerModalProps {
    open: boolean;
    onClose: () => void;
    cardId: string;
    boardId: string;
    labels: Label[];
    selectedLabelIds: string[];
    onRefresh: () => void;
    onCardRefresh?: () => void;
}

type View = 'list' | 'create' | 'edit';

export default function LabelPickerModal({
    open,
    onClose,
    cardId,
    boardId,
    labels,
    selectedLabelIds,
    onRefresh,
    onCardRefresh,
}: LabelPickerModalProps) {
    const [view, setView] = useState<View>('list');
    const t = useTranslation();
    const token = useAppToken();
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [color, setColor] = useState(LABEL_COLORS[0]);
    const [loading, setLoading] = useState(false);

    // Reset view when modal opens/closes
    useEffect(() => {
        if (open) {
            setView('list');
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setName('');
        setColor(LABEL_COLORS[0]);
        setEditingLabel(null);
    };

    const handleToggleLabel = async (labelId: string) => {
        const hasLabel = selectedLabelIds.includes(labelId);
        try {
            if (hasLabel) {
                await api.delete(`/cards/${cardId}/labels/${labelId}`);
            } else {
                await api.post(`/cards/${cardId}/labels`, { label_id: labelId });
            }
            onCardRefresh?.();
            onRefresh();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_LABEL'), color: 'red' });
        }
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
            onCardRefresh?.();
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
            onCardRefresh?.();
            handleBack();
            notifications.show({ message: t('SUCCESS_LABEL_DELETED'), color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_DELETE_LABEL'), color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // List View
    const renderListView = () => (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {labels.map((label) => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                        <div
                            key={label.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {/* Label color bar (clickable to toggle) */}
                            <div
                                onClick={() => handleToggleLabel(label.id)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: 4,
                                    backgroundColor: label.color,
                                    cursor: 'pointer',
                                    color: token.colorWhite,
                                }}
                            >
                                <span style={{ flex: 1 }}>{label.name || ''}</span>
                                {isSelected && <IconCheck size={16} />}
                            </div>
                            {/* Edit button */}
                            <Button
                                variant="subtle"
                                size="sm"
                                leftSection={<IconEdit size={16} />}
                                onClick={(e) => handleStartEdit(label, e)}
                                style={{
                                    color: 'var(--text-secondary)',
                                    minWidth: 32,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <Button variant="default" fullWidth onClick={handleStartCreate}>
                {t('UI_CREATE_NEW_LABEL')}
            </Button>
        </div>
    );

    // Create/Edit View
    const renderFormView = () => (
        <div>
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

            {/* Preview */}
            <div
                style={{
                    padding: '10px 12px',
                    borderRadius: 4,
                    backgroundColor: color,
                    color: token.colorWhite,
                    marginBottom: 12,
                    minHeight: 32,
                }}
            >
                {name || ''}
            </div>

            {/* Name input */}
            <div style={{ marginBottom: 12 }}>
                <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    {t('UI_TITLE')}
                </Text>
                <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('UI_PLACEHOLDER_LABEL_NAME')}
                    size="sm"
                />
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: 12 }}>
                <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    {t('UI_SELECT_COLOR')}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {LABEL_COLORS.map((c) => (
                        <div
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: 48,
                                height: 32,
                                borderRadius: 4,
                                backgroundColor: c,
                                cursor: 'pointer',
                                border: color === c ? `2px solid ${token.colorText}` : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {color === c && <IconCheck size={16} style={{ color: token.colorWhite }} />}
                        </div>
                    ))}
                </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button

                    onClick={view === 'create' ? handleCreate : handleUpdate}
                    loading={loading}
                >
                    {view === 'create' ? t('UI_CREATE') : t('UI_SAVE')}
                </Button>
                {view === 'edit' && (
                    <Button
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleDelete}
                        loading={loading}
                    >
                        {t('UI_DELETE')}
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Modal
            title={t('UI_LABELS')}
            opened={open}
            onClose={onClose}
            size={320}
        >
            {view === 'list' ? renderListView() : renderFormView()}
        </Modal>
    );
}
