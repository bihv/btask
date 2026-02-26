'use client';

import { useState } from 'react';
import { Modal, List, Button, Typography, Space, Tag, Empty, App, Tabs, Input, Avatar, Card, Row, Col, Tooltip } from 'antd';
import { ThunderboltOutlined, SettingOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined, ShopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useBoardPlugins, usePublishedPlugins, useInstallPluginToBoard, useUninstallPluginFromBoard } from '@/hooks/usePlugins';
import PluginSettingsModal from './PluginSettingsModal';
import { Plugin } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

const { Text, Title, Paragraph } = Typography;

interface BoardPluginsModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
    workspaceId: string;
}

export default function BoardPluginsModal({ open, onClose, boardId, workspaceId }: BoardPluginsModalProps) {
    const { modal, message } = App.useApp();
    const t = useTranslation();
    const [activeTab, setActiveTab] = useState('installed');
    const [searchText, setSearchText] = useState('');

    // Queries
    const { data: installedPlugins = [], isLoading: loadingInstalled } = useBoardPlugins(boardId);
    const { data: availablePlugins = [], isLoading: loadingAvailable } = usePublishedPlugins();

    // Mutations
    const installPlugin = useInstallPluginToBoard();
    const uninstallPlugin = useUninstallPluginFromBoard();

    // Settings modal state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState<any>(null);

    // Derived state
    const installedSlugs = new Set(installedPlugins.map((inst: any) => inst.plugin?.slug));

    const filteredAvailable = availablePlugins.filter((p: Plugin) =>
        (p.name.toLowerCase().includes(searchText.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchText.toLowerCase())) &&
        !installedSlugs.has(p.slug)
    );

    const handleInstall = async (plugin: Plugin) => {
        try {
            await installPlugin.mutateAsync({ boardId, slug: plugin.slug });
            message.success(`${plugin.name} ${t('SUCCESS_PLUGIN_INSTALLED')}`);
            setActiveTab('installed');
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_INSTALL_PLUGIN_FAILED'));
        }
    };

    const handleUninstall = (installation: any) => {
        const isInherited = !!installation.workspace_id;

        if (isInherited) {
            message.info(t('UI_WORKSPACE_PLUGIN_INFO'));
            return;
        }

        modal.confirm({
            title: `Uninstall ${installation.plugin.name}?`,
            content: t('UI_PLUGIN_UNINSTALL_CONFIRM'),
            okText: t('UI_UNINSTALL'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await uninstallPlugin.mutateAsync({ boardId, slug: installation.plugin.slug });
                    message.success(t('SUCCESS_PLUGIN_UNINSTALLED'));
                } catch {
                    message.error(t('ERROR_UNINSTALL_PLUGIN_FAILED'));
                }
            },
        });
    };

    const InstalledTab = () => (
        <List
            loading={loadingInstalled}
            dataSource={installedPlugins}
            locale={{ emptyText: <Empty description={t('UI_NO_PLUGINS_ENABLED')} /> }}
            renderItem={(item: any) => {
                const isInherited = !!item.workspace_id;
                return (
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
                                {t('UI_SETTINGS')}
                            </Button>,
                            isInherited ? (
                                <Tooltip title={t('UI_WORKSPACE_INHERITED')}>
                                    <Button disabled icon={<DeleteOutlined />} />
                                </Tooltip>
                            ) : (
                                <Button
                                    key="uninstall"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleUninstall(item)}
                                    loading={uninstallPlugin.isPending && uninstallPlugin.variables?.slug === item.plugin.slug}
                                />
                            )
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    src={item.plugin.icon_url}
                                    icon={<ThunderboltOutlined />}
                                    shape="square"
                                    size="large"
                                    style={{ backgroundColor: isInherited ? '#8c8c8c' : '#1890ff' }}
                                />
                            }
                            title={
                                <Space>
                                    <Text strong>{item.plugin.name}</Text>
                                    {isInherited && <Tag color="blue">Workspace</Tag>}
                                    {!isInherited && <Tag color="cyan">Board</Tag>}
                                </Space>
                            }
                            description={item.plugin.description}
                        />
                    </List.Item>
                );
            }}
        />
    );

    const AvailableTab = () => (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder={t('UI_PLACEHOLDER_SEARCH_PLUGINS')}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            {filteredAvailable.length === 0 ? (
                <Empty description={t('UI_NO_NEW_PLUGINS')} />
            ) : (
                <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={filteredAvailable}
                    loading={loadingAvailable}
                    renderItem={(plugin: Plugin) => (
                        <List.Item>
                            <Card
                                hoverable
                                size="small"
                                actions={[
                                    <Button
                                        type="primary"
                                        ghost
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => handleInstall(plugin)}
                                        loading={installPlugin.isPending && installPlugin.variables?.slug === plugin.slug}
                                    >
                                        {t('UI_ADD')}
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar src={plugin.icon_url} icon={<ThunderboltOutlined />} />}
                                    title={plugin.name}
                                    description={
                                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 12 }}>
                                            {plugin.description}
                                        </Paragraph>
                                    }
                                />
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <>
            <Modal
                title={
                    <Space>
                        <ThunderboltOutlined />
                        <span>{t('UI_BOARD_POWER_UPS')}</span>
                    </Space>
                }
                open={open}
                onCancel={onClose}
                footer={null}
                width={'90vw'}
                styles={{
                    body: {
                        padding: '0 24px 24px'
                    }
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'installed',
                            label: (
                                <span>
                                    <CheckCircleOutlined /> {t('UI_INSTALLED')}
                                </span>
                            ),
                            children: <InstalledTab />,
                        },
                        {
                            key: 'available',
                            label: (
                                <span>
                                    <ShopOutlined /> {t('UI_BROWSE_MARKETPLACE')}
                                </span>
                            ),
                            children: <AvailableTab />,
                        },
                    ]}
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
