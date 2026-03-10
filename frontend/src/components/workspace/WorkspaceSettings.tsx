'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useDeleteWorkspace, useUpdateWorkspace } from '@/hooks/useWorkspaces';
import { Workspace } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Divider, Group, Modal, Text, Textarea, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

interface WorkspaceSettingsProps {
    workspace: Workspace;
}

export default function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const t = useTranslation();
    const router = useRouter();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const updateWorkspace = useUpdateWorkspace();
    const deleteWorkspace = useDeleteWorkspace();

    const form = useForm({
        initialValues: {
            name: workspace.name,
            description: workspace.description || '',
        },
    });

    const handleUpdate = async (values: typeof form.values) => {
        try {
            await updateWorkspace.mutateAsync({ id: workspace.id, data: values });
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error,
                color: 'red'
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteWorkspace.mutateAsync(workspace.id);
            router.push('/workspaces');
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error,
                color: 'red'
            });
        }
    };

    return (
        <div>
            <Title order={4} mb="lg">{t('UI_WORKSPACE_SETTINGS')}</Title>

            <form onSubmit={form.onSubmit(handleUpdate)}>
                <TextInput
                    label={t('UI_NAME')}
                    mb="md"
                    {...form.getInputProps('name')}
                />

                <Textarea
                    label={t('UI_DESCRIPTION')}
                    rows={4}
                    mb="lg"
                    {...form.getInputProps('description')}
                />

                <Group justify="flex-end">
                    <Button type="submit" loading={updateWorkspace.isPending}>
                        {t('UI_SAVE_CHANGES')}
                    </Button>
                </Group>
            </form>

            <Divider my="xl" />

            <div style={{ padding: '16px', border: '1px solid var(--mantine-color-red-filled)', borderRadius: '8px' }}>
                <Title order={5} c="red" mb="xs">{t('UI_DANGER_ZONE')}</Title>
                <Text mb="md">
                    {t('UI_DELETE_WORKSPACE_DESC')}
                </Text>
                <Button color="red" onClick={() => setDeleteModalOpen(true)}>
                    {t('UI_DELETE_WORKSPACE')}
                </Button>
            </div>

            <Modal
                title={t('UI_CONFIRM_DELETE')}
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                centered
            >
                <Text mb="lg">
                    {t('UI_CONFIRM_DELETE_WORKSPACE')}
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        {t('UI_CANCEL')}
                    </Button>
                    <Button
                        color="red"
                        onClick={() => {
                            setDeleteModalOpen(false);
                            handleDelete();
                        }}
                        loading={deleteWorkspace.isPending}
                    >
                        {t('UI_DELETE_WORKSPACE')}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
