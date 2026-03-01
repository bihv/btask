'use client';

import { useState, useEffect } from 'react';
import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Modal, TextInput, Button, Select, Text, Group } from '@mantine/core';
import { useForm } from '@mantine/form';

// Default background
const DEFAULT_BACKGROUND = SOLID_COLORS[0];

export interface CreateBoardData {
    title: string;
    background_color: string;
    background_image: string;
    workspace_id?: string;
}

interface Workspace {
    id: string;
    name: string;
}

interface CreateBoardModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (data: CreateBoardData) => Promise<void>;
    loading?: boolean;
    workspaces?: Workspace[];
    showWorkspaceSelect?: boolean;
    onCreateWorkspace?: () => void;
}

export default function CreateBoardModal({
    open,
    onCancel,
    onSubmit,
    loading = false,
    workspaces,
    showWorkspaceSelect = false,
    onCreateWorkspace,
}: CreateBoardModalProps) {
    const t = useTranslation();
    const token = useAppToken();

    const form = useForm({
        initialValues: {
            title: '',
            workspaceId: null as string | null,
            selectedBackground: DEFAULT_BACKGROUND,
            selectedImage: '',
        },
        validate: {
            title: (value) => (!value.trim() ? 'Title is required' : null),
        }
    });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!values.title.trim()) return;
        await onSubmit({
            title: values.title.trim(),
            background_color: values.selectedImage ? '' : values.selectedBackground,
            background_image: values.selectedImage,
            workspace_id: values.workspaceId || undefined,
        });
    };

    const handleCancel = () => {
        form.reset();
        onCancel();
    };

    // If workspace selection is required but no workspaces available
    if (showWorkspaceSelect && (!workspaces || workspaces.length === 0)) {
        return (
            <Modal
                title={t('UI_CREATE_BOARD')}
                opened={open}
                onClose={handleCancel}
            >
                <div style={{ textAlign: "center", padding: '24px 0' }}>
                    <Text c="dimmed" mb={16}>{t('UI_NO_WORKSPACES')}</Text>
                    {onCreateWorkspace && (
                        <Button onClick={onCreateWorkspace}>
                            {t('UI_CREATE_WORKSPACE')}
                        </Button>
                    )}
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            title="Create Board"
            opened={open}
            onClose={handleCancel}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {/* Preview */}
                <div
                    style={{
                        height: 100,
                        borderRadius: 8,
                        marginBottom: 16,
                        background: form.values.selectedImage
                            ? `url(${form.values.selectedImage}) center/cover`
                            : form.values.selectedBackground,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: token.colorWhite, fontSize: 18, fontWeight: 600, textShadow: `0 1px 2px ${token.colorOverlayDark}` }}>
                        {t('UI_PREVIEW')}
                    </Text>
                </div>

                {/* Workspace Select (optional) */}
                {showWorkspaceSelect && workspaces && (
                    <div style={{ marginBottom: 12 }}>
                        <Select
                            placeholder={t('UI_PLACEHOLDER_SELECT_WORKSPACE')}
                            data={workspaces.map((ws) => ({
                                value: ws.id,
                                label: ws.name,
                            }))}
                            {...form.getInputProps('workspaceId')}
                        />
                    </div>
                )}

                {/* Board Title */}
                <div style={{ marginBottom: 12 }}>
                    <TextInput
                        placeholder="e.g., Project Alpha"
                        autoFocus={!showWorkspaceSelect}
                        {...form.getInputProps('title')}
                    />
                </div>

                {/* Background Picker */}
                <div style={{ marginBottom: 16 }}>
                    <BackgroundPicker
                        value={form.values.selectedBackground}
                        imageValue={form.values.selectedImage}
                        onChange={(val) => form.setFieldValue('selectedBackground', val)}
                        onImageChange={(val) => form.setFieldValue('selectedImage', val)}
                    />
                </div>

                {/* Actions */}
                <Group justify="flex-end">
                    <Button variant="default" onClick={handleCancel}>
                        {t('UI_CANCEL')}
                    </Button>
                    <Button type="submit" loading={loading}>
                        {t('UI_CREATE')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
