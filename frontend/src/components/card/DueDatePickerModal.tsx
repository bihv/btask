'use client';

import React from 'react';
import { Modal, DatePicker, Checkbox, Button, Typography, App } from 'antd';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const { Text } = Typography;

interface DueDatePickerModalProps {
    open: boolean;
    onClose: () => void;
    cardId: string;
    boardId: string;
    dueDate: string | undefined;
    isCompleted: boolean;
    onUpdate: (updates: { due_date?: string; is_completed?: boolean }) => void;
}

export default function DueDatePickerModal({
    open,
    onClose,
    cardId,
    boardId,
    dueDate,
    isCompleted,
    onUpdate,
}: DueDatePickerModalProps) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const handleDateChange = async (date: dayjs.Dayjs | null) => {
        try {
            const newDueDate = date ? date.toISOString() : undefined;
            await api.put(`/cards/${cardId}`, { due_date: newDueDate || null });
            onUpdate({ due_date: newDueDate });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            if (date) {
                onClose();
            }
        } catch (error) {
            message.error('Failed to update due date');
        }
    };

    const handleCompletedChange = async (checked: boolean) => {
        try {
            await api.put(`/cards/${cardId}`, { is_completed: checked });
            onUpdate({ is_completed: checked });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            message.error('Failed to update completion status');
        }
    };

    return (
        <Modal
            title="Due Date"
            open={open}
            onCancel={onClose}
            footer={null}
            width={320}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DatePicker
                    showTime
                    value={dueDate ? dayjs(dueDate) : null}
                    onChange={handleDateChange}
                    style={{ width: '100%' }}
                    placeholder="Select due date"
                />

                {dueDate && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Checkbox
                                checked={isCompleted}
                                onChange={(e) => handleCompletedChange(e.target.checked)}
                            >
                                Mark as complete
                            </Checkbox>
                        </div>

                        <Button
                            type="text"
                            danger
                            block
                            onClick={() => handleDateChange(null)}
                        >
                            Remove due date
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
}
