'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings, useUpdateSystemSettings, useRunCleanup } from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Card, Loader, NumberInput, Switch, Button, Divider, Alert, TextInput, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconClock, IconCloudUpload, IconTrash } from '@tabler/icons-react';

export default function GeneralSettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const { data: settings, isLoading, refetch } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const runCleanup = useRunCleanup();
    const t = useTranslation();

    // Form state
    const form = useForm({
        initialValues: {
            orphan_cleanup_days: 7,
            orphan_cleanup_enabled: true,
            max_upload_size_mb: 10,
        }
    });

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (settings) {
            form.setValues({
                orphan_cleanup_days: settings.orphan_cleanup_days ?? 7,
                orphan_cleanup_enabled: settings.orphan_cleanup_enabled ?? true,
                max_upload_size_mb: settings.max_upload_size_mb ?? 10,
            });
        }
    }, [settings]);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            await updateSettings.mutateAsync(values);
            notifications.show({ message: t('UI_SETTINGS_SAVED'), color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_SAVE_SETTINGS'), color: 'red' });
        }
    };

    const handleRunCleanup = async () => {
        try {
            const result = await runCleanup.mutateAsync();
            notifications.show({ message: `Cleanup completed: ${result.deleted} files deleted, ${result.failed} failed`, color: 'green' });
            refetch();
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_RUN_CLEANUP'), color: 'red' });
        }
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title order={2} style={{ marginBottom: 24 }}>
                <IconSettings size={16} style={{ marginRight: 8 }} />
                {t('UI_GENERAL_SETTINGS')}
            </Title>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader size="lg" />
                </div>
            ) : (
                <Stack gap="lg">
                    <Card withBorder>
                        <Title order={4} mb="md">{t('UI_FILE_STORAGE_SETTINGS')}</Title>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Title order={5} style={{ marginTop: 0, marginBottom: 16 }}>
                                <IconTrash size={16} style={{ marginRight: 8 }} />
                                {t('UI_ORPHAN_FILE_CLEANUP')}
                            </Title>

                            <Alert color="blue" mb="md">
                                When users upload images and later remove them, these files become &apos;orphaned&apos;.
                            </Alert>

                            <div style={{ marginBottom: 16 }}>
                                <Switch
                                    label={form.values.orphan_cleanup_enabled ? t('UI_ENABLED') : t('UI_DISABLED')}
                                    {...form.getInputProps('orphan_cleanup_enabled', { type: 'checkbox' })}
                                />
                            </div>

                            <Group mb="md">
                                <NumberInput
                                    min={1}
                                    max={365}
                                    style={{ width: 155 }}
                                    {...form.getInputProps('orphan_cleanup_days')}
                                />
                                <Text c="dimmed">days</Text>
                            </Group>

                            <Group mb="md">
                                <Button
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={handleRunCleanup}
                                    loading={runCleanup.isPending}
                                >
                                    {t('UI_RUN_CLEANUP_NOW')}
                                </Button>
                                <Text c="dimmed">
                                    Delete files older than {settings?.orphan_cleanup_days || 7} days
                                </Text>
                            </Group>

                            <Divider style={{ margin: '24px 0' }} />

                            <Title order={5} style={{ marginTop: 0, marginBottom: 16 }}>
                                <IconCloudUpload size={16} style={{ marginRight: 8 }} />
                                {t('UI_UPLOAD_CONFIGURATION')}
                            </Title>

                            <Group mb="md">
                                <NumberInput
                                    min={1}
                                    max={500}
                                    style={{ width: 160 }}
                                    {...form.getInputProps('max_upload_size_mb')}
                                />
                                <Text c="dimmed">MB</Text>
                            </Group>

                            <div>
                                <Button type="submit" loading={updateSettings.isPending}>
                                    {t('UI_SAVE_CHANGES')}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <Card withBorder>
                        <Title order={4} mb="md">{t('UI_SYSTEM_INFORMATION')}</Title>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <Text c="dimmed">
                                    <IconClock size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                    {t('UI_LAST_CLEANUP_RUN')}
                                </Text>
                                <Text>
                                    {settings?.last_orphan_cleanup_at
                                        ? new Date(settings.last_orphan_cleanup_at).toLocaleString()
                                        : t('UI_NEVER')
                                    }
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <Text c="dimmed">{t('UI_SETTINGS_LAST_UPDATED')}</Text>
                                <Text>
                                    {settings?.updated_at
                                        ? new Date(settings.updated_at).toLocaleString()
                                        : t('UI_NEVER')
                                    }
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Stack>
            )}
        </>
    );
}
