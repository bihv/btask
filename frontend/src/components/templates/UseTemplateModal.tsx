'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useTemplateToBoard } from '@/hooks/useTemplates';
import type { Template } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

import { useForm } from '@mantine/form';
import { Modal, Select, TextInput, Loader, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
interface UseTemplateModalProps {
    template: Template;
    open: boolean;
    onClose: () => void;
}

export default function UseTemplateModal({ template, open, onClose }: UseTemplateModalProps) {
    const router = useRouter();
    const t = useTranslation();

    const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
    const { mutate: createFromTemplate, isPending } = useTemplateToBoard();

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

    const form = useForm({
        initialValues: {
            boardTitle: template.title,
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        if (!selectedWorkspaceId) {
            notifications.show({ title: 'Error', message: t('VALIDATE_SELECT_WORKSPACE'), color: 'red' });
            return;
        }

        createFromTemplate(
            {
                templateId: template.id,
                workspaceId: selectedWorkspaceId,
                boardTitle: values.boardTitle || template.title,
            },
            {
                onSuccess: (board) => {
                    onClose();
                    form.reset();
                    // Redirect to the new board
                    router.push(`/boards/${board.id}`);
                },
                onError: (error: any) => {
                    const errorMsg = error?.response?.data?.message || t('ERROR_CREATE_FROM_TEMPLATE');
                    notifications.show({ title: 'Error', message: errorMsg, color: 'red' });
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset();
        setSelectedWorkspaceId('');
        onClose();
    };

    return (
        <Modal
            title={t('UI_USE_TEMPLATE')}
            opened={open}
            onClose={handleCancel}
            size={500}
        >
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            background: template.cover_url
                                ? `url(${template.cover_url}) center/cover`
                                : template.cover_color || '#0079bf',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {!template.cover_url && (
                            <img
                                src="/mello-icon-only.svg"
                                alt="Template"
                                style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
                            />
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{template.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            by {template.author || 'Mello'}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div style={{ marginBottom: '16px' }}>
                    {isLoadingWorkspaces ? (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <Loader size="sm" />
                        </div>
                    ) : workspaces.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {t('UI_NO_WORKSPACES')}
                        </div>
                    ) : (
                        <Select
                            placeholder={t('UI_PLACEHOLDER_WORKSPACE')}
                            size="md"
                            value={selectedWorkspaceId || null}
                            onChange={(val) => val && setSelectedWorkspaceId(val)}
                            data={workspaces.map((ws) => ({
                                label: ws.name,
                                value: ws.id,
                            }))}
                        />
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_BOARD_TITLE')}
                        size="md"
                        maxLength={100}
                        {...form.getInputProps('boardTitle')}
                    />
                </div>

                <Group justify="flex-end">
                    <Button variant="default" onClick={handleCancel}>
                        {t('UI_CANCEL')}
                    </Button>
                    <Button type="submit" loading={isPending}>
                        {t('UI_CREATE_BOARD')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
