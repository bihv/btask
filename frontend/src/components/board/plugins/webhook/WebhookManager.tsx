'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useDeleteWebhook, useWebhooks, Webhook } from '@/hooks/useWebhooks';
import { useState } from 'react';
import WebhookForm from './WebhookForm';

import { Badge, Button, Card, Center, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCircleCheck, IconCircleX, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

interface WebhookManagerProps {
    pluginId: string;
    installationId: string;
}

export default function WebhookManager({ pluginId, installationId }: WebhookManagerProps) {
    const t = useTranslation();
    const { data: webhooks = [], isLoading } = useWebhooks(pluginId, installationId);
    const deleteWebhook = useDeleteWebhook();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteWebhook.mutateAsync(id);
            notifications.show({ message: t('SUCCESS_WEBHOOK_DELETED'), color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_DELETE_WEBHOOK_FAILED'), color: 'red' });
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text c="dimmed">
                    {t('UI_WEBHOOKS_DESCRIPTION')}
                </Text>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                        setEditingWebhook(null);
                        setIsModalOpen(true);
                    }}
                >
                    {t('UI_ADD_WEBHOOK')}
                </Button>
            </div>

            {isLoading ? (
                <Center py="xl"><Loader size="sm" /></Center>
            ) : webhooks.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">{t('UI_NO_WEBHOOKS')}</Text>
            ) : (
                <Stack gap={8}>
                    {webhooks.map((item: Webhook) => (
                        <Card key={item.id} withBorder>
                            <Group justify="space-between" align="flex-start">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap={8} mb={4}>
                                        <Text fw={700} style={{ wordBreak: 'break-all' }}>{item.callback_url}</Text>
                                        {item.is_active ? (
                                            <Badge color="green" leftSection={<IconCircleCheck size={14} />}>{t('UI_ACTIVE')}</Badge>
                                        ) : (
                                            <Badge color="red" leftSection={<IconCircleX size={14} />}>{t('UI_INACTIVE')}</Badge>
                                        )}
                                    </Group>
                                    <Group gap={4} wrap="wrap" mb={4}>
                                        {item.events.map((event: string) => (
                                            <Badge key={event} size="sm">{event}</Badge>
                                        ))}
                                    </Group>
                                    {item.last_triggered_at && (
                                        <Text c="dimmed" size="xs">
                                            {t('UI_LAST_TRIGGERED')} {new Date(item.last_triggered_at).toLocaleString()}
                                            {item.last_error && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>({t('UI_ERROR_LABEL')} {item.last_error})</span>}
                                        </Text>
                                    )}
                                </div>
                                <Group gap={4}>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => {
                                            setEditingWebhook(item);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        {t('UI_EDIT')}
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => handleDelete(item.id)}
                                    />
                                </Group>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}

            <Modal
                title={editingWebhook ? t('UI_EDIT_WEBHOOK') : t('UI_ADD_WEBHOOK')}
                opened={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingWebhook(null);
                }}
                size="lg"
            >
                <WebhookForm
                    pluginId={pluginId}
                    installationId={installationId}
                    initialValues={editingWebhook || undefined}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingWebhook(null);
                    }}
                />
            </Modal>
        </div>
    );
}
