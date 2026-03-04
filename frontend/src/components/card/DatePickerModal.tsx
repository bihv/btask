'use client';

import { useTranslation } from '@/hooks/useLabels';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Checkbox, Modal, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
interface DatePickerModalProps {
    open: boolean;
    onClose: () => void;
    cardId: string;
    boardId: string;
    startDate: string | undefined;
    dueDate: string | undefined;
    isCompleted: boolean;
    onUpdate: (updates: { start_date?: string; due_date?: string; is_completed?: boolean }) => void;
}

export default function DatePickerModal({
    open,
    onClose,
    cardId,
    boardId,
    startDate,
    dueDate,
    isCompleted,
    onUpdate,
}: DatePickerModalProps) {
    const queryClient = useQueryClient();
    const t = useTranslation();

    const handleStartDateChange = async (date: any) => {
        try {
            const newStartDate = date ? new Date(date).toISOString() : undefined;
            await api.put(`/cards/${cardId}`, { start_date: newStartDate || null });
            onUpdate({ start_date: newStartDate });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_START_DATE'), color: 'red' });
        }
    };

    const handleDueDateChange = async (date: any) => {
        try {
            const newDueDate = date ? new Date(date).toISOString() : undefined;
            await api.put(`/cards/${cardId}`, { due_date: newDueDate || null });
            onUpdate({ due_date: newDueDate });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_DUE_DATE'), color: 'red' });
        }
    };

    const handleCompletedChange = async (checked: boolean) => {
        try {
            await api.put(`/cards/${cardId}`, { is_completed: checked });
            onUpdate({ is_completed: checked });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_COMPLETION'), color: 'red' });
        }
    };

    return (
        <Modal
            title={t('UI_DATES')}
            opened={open}
            onClose={onClose}
            size={320}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Start Date */}
                <div>
                    <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        {t('UI_START_DATE')}
                    </Text>
                    <DateTimePicker
                        value={startDate ? new Date(startDate) : null}
                        onChange={handleStartDateChange}
                        style={{ width: '100%' }}
                        placeholder={t('UI_SELECT_START_DATE')}
                        maxDate={dueDate ? new Date(dueDate) : undefined}
                    />
                </div>

                {/* Due Date */}
                <div>
                    <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        {t('UI_DUE_DATE_LABEL')}
                    </Text>
                    <DateTimePicker
                        value={dueDate ? new Date(dueDate) : null}
                        onChange={handleDueDateChange}
                        style={{ width: '100%' }}
                        placeholder={t('UI_SELECT_DUE_DATE')}
                        minDate={startDate ? new Date(startDate) : undefined}
                    />
                </div>

                {dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                            label={t('UI_MARK_COMPLETE')}
                            checked={isCompleted}
                            onChange={(e) => handleCompletedChange(e.currentTarget.checked)}
                        />
                    </div>
                )}

                {(startDate || dueDate) && (
                    <Button
                        variant="subtle"
                        color="red"
                        fullWidth
                        onClick={async () => {
                            try {
                                await api.put(`/cards/${cardId}`, {
                                    start_date: null,
                                    due_date: null,
                                });
                                onUpdate({ start_date: undefined, due_date: undefined });
                                queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
                            } catch (error) {
                                notifications.show({ title: 'Error', message: t('ERROR_REMOVE_DATES'), color: 'red' });
                            }
                        }}
                    >
                        {t('UI_REMOVE_ALL_DATES')}
                    </Button>
                )}
            </div>
        </Modal>
    );
}
