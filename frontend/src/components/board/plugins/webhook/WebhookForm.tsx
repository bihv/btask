'use client';

import { Form, Input, Button, Select, Switch, App, Alert } from 'antd';
import { useCreateWebhook, useUpdateWebhook, Webhook } from '@/hooks/useWebhooks';
import { useEffect } from 'react';

const { Option } = Select;

const EVENTS = [
    { label: 'Card Created', value: 'card:created' },
    { label: 'Card Updated', value: 'card:updated' },
    { label: 'Card Deleted', value: 'card:deleted' },
    { label: 'Card Moved', value: 'card:moved' },
];

interface WebhookFormProps {
    pluginId: string;
    installationId: string;
    initialValues?: Webhook;
    onSuccess: () => void;
}

export default function WebhookForm({ pluginId, installationId, initialValues, onSuccess }: WebhookFormProps) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
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
                message.success('Webhook updated');
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
                message.success('Webhook created');
            }
            form.resetFields();
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save webhook');
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
                label="Callback URL"
                rules={[
                    { required: true, message: 'Please enter a valid URL' },
                    { type: 'url', message: 'Must be a valid URL' }
                ]}
                extra="The URL where we'll send POST requests."
            >
                <Input placeholder="https://api.example.com/webhook" />
            </Form.Item>

            <Form.Item
                name="secret"
                label="Secret"
                rules={[
                    { required: !initialValues, message: 'Secret is required for new webhooks' },
                    { min: 16, message: 'Secret must be al least 16 characters' }
                ]}
                extra={initialValues ? "Leave blank to keep existing secret." : "Used to sign requests (HMAC-SHA256). Must be at least 16 chars."}
            >
                <Input.Password placeholder="Enter a strong secret..." />
            </Form.Item>

            <Form.Item
                name="events"
                label="Events"
                rules={[{ required: true, message: 'Please select at least one event' }]}
            >
                <Select mode="multiple" placeholder="Select events to trigger this webhook">
                    {EVENTS.map(e => (
                        <Option key={e.value} value={e.value}>{e.label}</Option>
                    ))}
                </Select>
            </Form.Item>

            {initialValues && (
                <Form.Item name="is_active" label="Status" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
            )}

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading} block>
                    {initialValues ? 'Save Changes' : 'Create Webhook'}
                </Button>
            </Form.Item>
        </Form>
    );
}
