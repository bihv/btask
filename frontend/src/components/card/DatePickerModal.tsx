'use client';

import React from 'react';
import { Modal, DatePicker, Checkbox, Button, Typography, App } from 'antd';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const t = useTranslation();

    const handleStartDateChange = async (date: dayjs.Dayjs | null) => {
        try {
            const newStartDate = date ? date.toISOString() : undefined;
            await api.put(`/cards/${cardId}`, { start_date: newStartDate || null });
            onUpdate({ start_date: newStartDate });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            message.error(t('ERROR_UPDATE_START_DATE'));
        }
    };

    const handleDueDateChange = async (date: dayjs.Dayjs | null) => {
        try {
            const newDueDate = date ? date.toISOString() : undefined;
            await api.put(`/cards/${cardId}`, { due_date: newDueDate || null });
            onUpdate({ due_date: newDueDate });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            message.error(t('ERROR_UPDATE_DUE_DATE'));
        }
    };

    const handleCompletedChange = async (checked: boolean) => {
        try {
            await api.put(`/cards/${cardId}`, { is_completed: checked });
            onUpdate({ is_completed: checked });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            message.error(t('ERROR_UPDATE_COMPLETION'));
        }
    };

    return (
        <Modal
            title={t('UI_DATES')}
            open={open}
            onCancel={onClose}
            footer={null}
            width={320}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Start Date */}
                <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        {t('UI_START_DATE')}
                    </Text>
                    <DatePicker
                        showTime
                        value={startDate ? dayjs(startDate) : null}
                        onChange={handleStartDateChange}
                        style={{ width: '100%' }}
                        placeholder={t('UI_SELECT_START_DATE')}
                        disabledDate={dueDate ? (current) => current && current.isAfter(dayjs(dueDate), 'day') : undefined}
                    />
                </div>

                {/* Due Date */}
                <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        {t('UI_DUE_DATE_LABEL')}
                    </Text>
                    <DatePicker
                        showTime
                        value={dueDate ? dayjs(dueDate) : null}
                        onChange={handleDueDateChange}
                        style={{ width: '100%' }}
                        placeholder={t('UI_SELECT_DUE_DATE')}
                        disabledDate={startDate ? (current) => current && current.isBefore(dayjs(startDate), 'day') : undefined}
                    />
                </div>

                {dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                            checked={isCompleted}
                            onChange={(e) => handleCompletedChange(e.target.checked)}
                        >
                            {t('UI_MARK_COMPLETE')}
                        </Checkbox>
                    </div>
                )}

                {(startDate || dueDate) && (
                    <Button
                        type="text"
                        danger
                        block
                        onClick={async () => {
                            try {
                                await api.put(`/cards/${cardId}`, {
                                    start_date: null,
                                    due_date: null,
                                });
                                onUpdate({ start_date: undefined, due_date: undefined });
                                queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
                            } catch (error) {
                                message.error(t('ERROR_REMOVE_DATES'));
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
