'use client';

import { useState } from 'react';
import { Button, List, Tag, Space, Typography, Popconfirm, Empty, App, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useWebhooks, useDeleteWebhook, Webhook } from '@/hooks/useWebhooks';
import WebhookForm from './WebhookForm';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

interface WebhookManagerProps {
    pluginId: string;
    installationId: string;
}

export default function WebhookManager({ pluginId, installationId }: WebhookManagerProps) {
    const { message } = App.useApp();
    const t = useTranslation();
    const { data: webhooks = [], isLoading } = useWebhooks(pluginId, installationId);
    const deleteWebhook = useDeleteWebhook();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteWebhook.mutateAsync(id);
            message.success(t('SUCCESS_WEBHOOK_DELETED'));
        } catch {
            message.error(t('ERROR_DELETE_WEBHOOK_FAILED'));
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                    {t('UI_WEBHOOKS_DESCRIPTION')}
                </Text>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingWebhook(null);
                        setIsModalOpen(true);
                    }}
                >
                    {t('UI_ADD_WEBHOOK')}
                </Button>
            </div>

            <List
                loading={isLoading}
                dataSource={webhooks}
                locale={{ emptyText: <Empty description={t('UI_NO_WEBHOOKS')} /> }}
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
                                {t('UI_EDIT')}
                            </Button>,
                            <Popconfirm
                                title={t('UI_DELETE_WEBHOOK')}
                                description={t('UI_CANNOT_UNDO')}
                                onConfirm={() => handleDelete(item.id)}
                                okText={t('UI_DELETE')}
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
                                        <Tag color="success" icon={<CheckCircleOutlined />}>{t('UI_ACTIVE')}</Tag> :
                                        <Tag color="error" icon={<CloseCircleOutlined />}>{t('UI_INACTIVE')}</Tag>
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
                                            {t('UI_LAST_TRIGGERED')} {new Date(item.last_triggered_at).toLocaleString()}
                                            {item.last_error && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>({t('UI_ERROR_LABEL')} {item.last_error})</span>}
                                        </Text>
                                    )}
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />

            <Modal
                title={editingWebhook ? t('UI_EDIT_WEBHOOK') : t('UI_ADD_WEBHOOK')}
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
