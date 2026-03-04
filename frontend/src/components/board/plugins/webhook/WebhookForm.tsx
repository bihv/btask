'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useCreateWebhook, useUpdateWebhook, Webhook } from '@/hooks/useWebhooks';
import { useEffect } from 'react';

import { Button, MultiSelect, PasswordInput, Switch, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

interface WebhookFormProps {
    pluginId: string;
    installationId: string;
    initialValues?: Webhook;
    onSuccess: () => void;
}

export default function WebhookForm({ pluginId, installationId, initialValues, onSuccess }: WebhookFormProps) {
    const t = useTranslation();

    const EVENTS = [
        { label: t('UI_EVENT_CARD_CREATED'), value: 'card:created' },
        { label: t('UI_EVENT_CARD_UPDATED'), value: 'card:updated' },
        { label: t('UI_EVENT_CARD_DELETED'), value: 'card:deleted' },
        { label: t('UI_EVENT_CARD_MOVED'), value: 'card:moved' },
    ];

    // Form state
    const form = useForm({
        initialValues: {
            callbackUrl: '',
            secret: '',
            events: [] as string[],
            isActive: true,
        },
        validate: {
            callbackUrl: (value) => (!value ? 'Callback URL is required' : null),
        },
    });

    const createWebhook = useCreateWebhook();
    const updateWebhook = useUpdateWebhook();

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                callbackUrl: initialValues.callback_url,
                secret: '', // We usually don't populate secrets
                events: initialValues.events || [],
                isActive: initialValues.is_active,
            });
        }
    }, [initialValues]);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            if (initialValues) {
                await updateWebhook.mutateAsync({
                    id: initialValues.id,
                    data: {
                        callback_url: values.callbackUrl,
                        events: values.events,
                        is_active: values.isActive,
                        secret: values.secret || undefined,
                    },
                });
                notifications.show({ message: t('SUCCESS_WEBHOOK_UPDATED'), color: 'green' });
            } else {
                await createWebhook.mutateAsync({
                    pluginId,
                    installationId,
                    data: {
                        callback_url: values.callbackUrl,
                        events: values.events,
                        secret: values.secret,
                    },
                });
                notifications.show({ message: t('SUCCESS_WEBHOOK_CREATED'), color: 'green' });
            }
            form.reset();
            onSuccess();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_SAVE_WEBHOOK_FAILED'), color: 'red' });
        }
    };

    const isLoading = createWebhook.isPending || updateWebhook.isPending;

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <div style={{ marginBottom: 12 }}>
                <TextInput
                    label="Callback URL"
                    placeholder="https://api.example.com/webhook"
                    required
                    {...form.getInputProps('callbackUrl')}
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <PasswordInput
                    label="Secret"
                    placeholder="Enter a strong secret..."
                    {...form.getInputProps('secret')}
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <MultiSelect
                    label="Events"
                    placeholder={t('UI_PLACEHOLDER_SELECT_EVENTS')}
                    data={EVENTS}
                    {...form.getInputProps('events')}
                />
            </div>

            {initialValues && (
                <div style={{ marginBottom: 12 }}>
                    <Switch
                        label={form.values.isActive ? t('UI_ACTIVE') : t('UI_INACTIVE')}
                        {...form.getInputProps('isActive', { type: 'checkbox' })}
                    />
                </div>
            )}

            <div>
                <Button type="submit" loading={isLoading} fullWidth>
                    {initialValues ? t('UI_SAVE_CHANGES') : t('UI_CREATE_WEBHOOK')}
                </Button>
            </div>
        </form>
    );
}
