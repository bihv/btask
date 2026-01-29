'use client';

import { useState } from 'react';
import { Modal, List, Button, Typography, Space, Tag, Empty, App } from 'antd';
import { ThunderboltOutlined, SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWorkspacePlugins, useUninstallPluginFromWorkspace } from '@/hooks/usePlugins';
import PluginSettingsModal from './PluginSettingsModal';

const { Text, Title } = Typography;

interface BoardPluginsModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
    workspaceId: string;
}

export default function BoardPluginsModal({ open, onClose, boardId, workspaceId }: BoardPluginsModalProps) {
    const { modal, message } = App.useApp();
    const { data: plugins = [], isLoading } = useWorkspacePlugins(workspaceId);
    const uninstallPlugin = useUninstallPluginFromWorkspace();

    // Settings modal state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState<any>(null);

    const handleUninstall = (plugin: any) => {
        modal.confirm({
            title: `Uninstall ${plugin.plugin.name}?`,
            content: 'This will remove the plugin from the workspace. All data and webhooks will be deleted.',
            okText: 'Uninstall',
            okType: 'danger',
            onOk: async () => {
                try {
                    await uninstallPlugin.mutateAsync({ workspaceId, slug: plugin.plugin.slug });
                    message.success('Plugin uninstalled');
                } catch {
                    message.error('Failed to uninstall plugin');
                }
            },
        });
    };

    return (
        <>
            <Modal
                title={
                    <Space>
                        <ThunderboltOutlined />
                        <span>Plugins (Power-Ups)</span>
                    </Space>
                }
                open={open}
                onCancel={onClose}
                footer={null}
                width={700}
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Enhance your board with plugins.</Text>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Marketplace coming soon!')}>
                        Add Plugin
                    </Button>
                </div>

                <List
                    loading={isLoading}
                    dataSource={plugins}
                    locale={{ emptyText: <Empty description="No plugins installed" /> }}
                    renderItem={(item: any) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="settings"
                                    icon={<SettingOutlined />}
                                    onClick={() => {
                                        setSelectedPlugin(item);
                                        setSettingsOpen(true);
                                    }}
                                >
                                    Settings
                                </Button>,
                                <Button
                                    key="uninstall"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleUninstall(item)}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    item.plugin.icon_url ?
                                        <img src={item.plugin.icon_url} alt="icon" style={{ width: 32, height: 32, borderRadius: 4 }} /> :
                                        <ThunderboltOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                }
                                title={
                                    <Space>
                                        <Text strong>{item.plugin.name}</Text>
                                        <Tag>{item.plugin.version}</Tag>
                                    </Space>
                                }
                                description={item.plugin.description}
                            />
                        </List.Item>
                    )}
                />
            </Modal>

            {selectedPlugin && (
                <PluginSettingsModal
                    open={settingsOpen}
                    onClose={() => {
                        setSettingsOpen(false);
                        setSelectedPlugin(null);
                    }}
                    plugin={selectedPlugin.plugin}
                    installationId={selectedPlugin.id}
                    boardId={boardId}
                />
            )}
        </>
    );
}
