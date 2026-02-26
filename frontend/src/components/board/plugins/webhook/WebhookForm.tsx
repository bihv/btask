'use client';

import { Form, Input, Button, Select, Switch, App, Alert } from 'antd';
import { useCreateWebhook, useUpdateWebhook, Webhook } from '@/hooks/useWebhooks';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useLabels';

const { Option } = Select;

interface WebhookFormProps {
    pluginId: string;
    installationId: string;
    initialValues?: Webhook;
    onSuccess: () => void;
}

export default function WebhookForm({ pluginId, installationId, initialValues, onSuccess }: WebhookFormProps) {
    const { message } = App.useApp();
    const t = useTranslation();
    const [form] = Form.useForm();

    const EVENTS = [
        { label: t('UI_EVENT_CARD_CREATED'), value: 'card:created' },
        { label: t('UI_EVENT_CARD_UPDATED'), value: 'card:updated' },
        { label: t('UI_EVENT_CARD_DELETED'), value: 'card:deleted' },
        { label: t('UI_EVENT_CARD_MOVED'), value: 'card:moved' },
    ];
    const createWebhook = useCreateWebhook();
    const updateWebhook = useUpdateWebhook();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                callback_url: initialValues.callback_url,
                events: initialValues.events,
                is_active: initialValues.is_active,
                // Secret cannot be retrieved, so usually left blank on edit unless changing
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async (values: any) => {
        try {
            if (initialValues) {
                await updateWebhook.mutateAsync({
                    id: initialValues.id,
                    data: {
                        callback_url: values.callback_url,
                        events: values.events,
                        is_active: values.is_active,
                        secret: values.secret || undefined, // Only send if provided
                    },
                });
                message.success(t('SUCCESS_WEBHOOK_UPDATED'));
            } else {
                await createWebhook.mutateAsync({
                    pluginId,
                    installationId,
                    data: {
                        callback_url: values.callback_url,
                        events: values.events,
                        secret: values.secret,
                        // board_id is handled by backend logic for now based on installation
                    },
                });
                message.success(t('SUCCESS_WEBHOOK_CREATED'));
            }
            form.resetFields();
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_SAVE_WEBHOOK_FAILED'));
        }
    };

    const isLoading = createWebhook.isPending || updateWebhook.isPending;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ is_active: true }}
        >
            <Form.Item
                name="callback_url"
                label={t('UI_CALLBACK_URL')}
                rules={[
                    { required: true, message: 'Please enter a valid URL' },
                    { type: 'url', message: 'Must be a valid URL' }
                ]}
                extra={t('UI_CALLBACK_URL_EXTRA')}
            >
                <Input placeholder="https://api.example.com/webhook" />
            </Form.Item>

            <Form.Item
                name="secret"
                label={t('UI_SECRET')}
                rules={[
                    { required: !initialValues, message: 'Secret is required for new webhooks' },
                    { min: 16, message: 'Secret must be al least 16 characters' }
                ]}
                extra={initialValues ? t('UI_SECRET_EXTRA_EDIT') : t('UI_SECRET_EXTRA_NEW')}
            >
                <Input.Password placeholder="Enter a strong secret..." />
            </Form.Item>

            <Form.Item
                name="events"
                label={t('UI_EVENTS')}
                rules={[{ required: true, message: 'Please select at least one event' }]}
            >
                <Select mode="multiple" placeholder={t('UI_PLACEHOLDER_SELECT_EVENTS')}>
                    {EVENTS.map(e => (
                        <Option key={e.value} value={e.value}>{e.label}</Option>
                    ))}
                </Select>
            </Form.Item>

            {initialValues && (
                <Form.Item name="is_active" label={t('UI_STATUS')} valuePropName="checked">
                    <Switch checkedChildren={t('UI_ACTIVE')} unCheckedChildren={t('UI_INACTIVE')} />
                </Form.Item>
            )}

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading} block>
                    {initialValues ? t('UI_SAVE_CHANGES') : t('UI_CREATE_WEBHOOK')}
                </Button>
            </Form.Item>
        </Form>
    );
}
