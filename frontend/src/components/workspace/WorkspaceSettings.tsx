'use client';

import { Workspace } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, TextInput, Button, Divider, Textarea, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

interface WorkspaceSettingsProps {
    workspace: Workspace;
}

export default function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const t = useTranslation();

    const form = useForm({
        initialValues: {
            name: workspace.name,
            description: workspace.description || '',
        },
    });

    const handleUpdate = (values: typeof form.values) => {
        console.log('Update workspace:', values);
        notifications.show({ message: t('UI_COMING_SOON'), color: 'blue' });
    };

    const handleDelete = () => {
        console.log('Delete workspace:', workspace.id);
        notifications.show({ message: t('UI_COMING_SOON'), color: 'blue' });
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
                    <Button type="submit">
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
                <Button color="red" onClick={handleDelete}>
                    {t('UI_DELETE_WORKSPACE')}
                </Button>
            </div>
        </div>
    );
}
