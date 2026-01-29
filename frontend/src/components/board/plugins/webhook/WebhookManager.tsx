'use client';

import { useState } from 'react';
import { Button, List, Tag, Space, Typography, Popconfirm, Empty, App, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useWebhooks, useDeleteWebhook, Webhook } from '@/hooks/useWebhooks';
import WebhookForm from './WebhookForm';

const { Text } = Typography;

interface WebhookManagerProps {
    pluginId: string;
    installationId: string;
}

export default function WebhookManager({ pluginId, installationId }: WebhookManagerProps) {
    const { message } = App.useApp();
    const { data: webhooks = [], isLoading } = useWebhooks(pluginId, installationId);
    const deleteWebhook = useDeleteWebhook();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteWebhook.mutateAsync(id);
            message.success('Webhook deleted');
        } catch {
            message.error('Failed to delete webhook');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                    Webhooks allow external services to be notified when certain events happen on this board.
                </Text>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingWebhook(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Webhook
                </Button>
            </div>

            <List
                loading={isLoading}
                dataSource={webhooks}
                locale={{ emptyText: <Empty description="No webhooks configured" /> }}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button
                                key="edit"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => {
                                    setEditingWebhook(item);
                                    setIsModalOpen(true);
                                }}
                            >
                                Edit
                            </Button>,
                            <Popconfirm
                                title="Delete webhook?"
                                description="This action cannot be undone."
                                onConfirm={() => handleDelete(item.id)}
                                okText="Delete"
                                okType="danger"
                                key="delete"
                            >
                                <Button danger icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <Space>
                                    <Text strong style={{ wordBreak: 'break-all' }}>{item.callback_url}</Text>
                                    {item.is_active ?
                                        <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag> :
                                        <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>
                                    }
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size={0}>
                                    <Space size={[0, 8]} wrap>
                                        {item.events.map(event => (
                                            <Tag key={event} style={{ marginRight: 4 }}>{event}</Tag>
                                        ))}
                                    </Space>
                                    {item.last_triggered_at && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <HistoryOutlined /> Last triggered: {new Date(item.last_triggered_at).toLocaleString()}
                                            {item.last_error && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>(Error: {item.last_error})</span>}
                                        </Text>
                                    )}
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />

            <Modal
                title={editingWebhook ? "Edit Webhook" : "Add Webhook"}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingWebhook(null);
                }}
                footer={null}
                width={600}
                destroyOnClose
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
