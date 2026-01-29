'use client';

import { useState } from 'react';
import { Card, Button, Input, Typography, Spin, Tag, Space, App, Row, Col, Empty, Modal, Avatar, Tooltip } from 'antd';
import { SearchOutlined, ThunderboltOutlined, CheckCircleOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { usePublishedPlugins, useWorkspacePlugins, useInstallPluginToWorkspace, useUninstallPluginFromWorkspace } from '@/hooks/usePlugins';
import { Plugin, PluginInstallation } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface WorkspacePowerUpsProps {
    workspace: {
        id: string;
        name: string;
    };
}

export default function WorkspacePowerUps({ workspace }: WorkspacePowerUpsProps) {
    const { message, modal } = App.useApp();
    const [searchText, setSearchText] = useState('');
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Fetch all published plugins
    const { data: allPlugins = [], isLoading: loadingAll } = usePublishedPlugins();
    // Fetch installed plugins for this workspace
    const { data: installedPlugins = [], isLoading: loadingInstalled } = useWorkspacePlugins(workspace.id);

    const installPlugin = useInstallPluginToWorkspace();
    const uninstallPlugin = useUninstallPluginFromWorkspace();

    // Get installed plugin slugs for easy lookup
    const installedSlugs = new Set(installedPlugins.map((inst: PluginInstallation) => inst.plugin?.slug).filter(Boolean));

    // Filter plugins by search
    const filteredPlugins = allPlugins.filter((p: Plugin) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleInstall = async (plugin: Plugin) => {
        try {
            await installPlugin.mutateAsync({ workspaceId: workspace.id, slug: plugin.slug });
            message.success(`${plugin.name} installed successfully!`);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to install plugin';
            message.error(errorMsg);
            console.error('Install failed:', error);
        }
    };

    const handleUninstall = async (plugin: Plugin, slug?: string) => {
        const pluginSlug = slug || plugin.slug;
        modal.confirm({
            title: `Uninstall ${plugin.name}?`,
            content: 'This will remove the plugin from all boards in this workspace.',
            okText: 'Uninstall',
            okType: 'danger',
            onOk: async () => {
                try {
                    await uninstallPlugin.mutateAsync({ workspaceId: workspace.id, slug: pluginSlug });
                    message.success(`${plugin.name} uninstalled`);
                } catch {
                    message.error('Failed to uninstall plugin');
                }
            },
        });
    };

    const showPluginDetails = (plugin: Plugin) => {
        setSelectedPlugin(plugin);
        setDetailModalOpen(true);
    };

    if (loadingAll || loadingInstalled) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading Power-Ups...</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <ThunderboltOutlined /> Power-Ups
                    </Title>
                    <Text type="secondary">Extend your workspace with powerful integrations</Text>
                </div>
            </div>

            {/* Search */}
            <Card size="small" style={{ marginBottom: 24 }}>
                <Input
                    placeholder="Search Power-Ups..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ maxWidth: 400 }}
                    allowClear
                />
            </Card>

            {/* Installed Plugins Section */}
            {installedPlugins.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Enabled ({installedPlugins.length})
                    </Title>
                    <Row gutter={[16, 16]}>
                        {installedPlugins.map((installation: PluginInstallation) => (
                            <Col key={installation.id} xs={24} sm={12} lg={8} xl={6}>
                                <Card
                                    size="small"
                                    hoverable
                                    style={{ height: '100%', borderColor: '#52c41a' }}
                                    onClick={() => installation.plugin && showPluginDetails(installation.plugin)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <Avatar
                                            src={installation.plugin?.icon_url}
                                            icon={<ThunderboltOutlined />}
                                            size={48}
                                            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{installation.plugin?.name}</div>
                                            <Paragraph
                                                type="secondary"
                                                ellipsis={{ rows: 2 }}
                                                style={{ marginBottom: 8, fontSize: 12 }}
                                            >
                                                {installation.plugin?.description || 'No description'}
                                            </Paragraph>
                                            <Tag color="green" style={{ margin: 0 }}>Enabled</Tag>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Available Plugins Section */}
            <div>
                <Title level={5} style={{ marginBottom: 16 }}>
                    Available Power-Ups ({filteredPlugins.filter((p: Plugin) => !installedSlugs.has(p.slug)).length})
                </Title>

                {filteredPlugins.length === 0 ? (
                    <Empty description="No Power-Ups available" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredPlugins
                            .filter((plugin: Plugin) => !installedSlugs.has(plugin.slug))
                            .map((plugin: Plugin) => (
                                <Col key={plugin.id} xs={24} sm={12} lg={8} xl={6}>
                                    <Card
                                        size="small"
                                        hoverable
                                        style={{ height: '100%' }}
                                        onClick={() => showPluginDetails(plugin)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            <Avatar
                                                src={plugin.icon_url}
                                                icon={<ThunderboltOutlined />}
                                                size={48}
                                                style={{ backgroundColor: '#8c8c8c', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{plugin.name}</div>
                                                <Paragraph
                                                    type="secondary"
                                                    ellipsis={{ rows: 2 }}
                                                    style={{ marginBottom: 8, fontSize: 12 }}
                                                >
                                                    {plugin.description || 'No description'}
                                                </Paragraph>
                                                <Space size={4}>
                                                    <Tag>{plugin.version}</Tag>
                                                    {plugin.install_count > 0 && (
                                                        <Tag color="blue">{plugin.install_count} installs</Tag>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                )}
            </div>

            {/* Plugin Detail Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                            src={selectedPlugin?.icon_url}
                            icon={<ThunderboltOutlined />}
                            size={40}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                        <div>
                            <div style={{ fontWeight: 600 }}>{selectedPlugin?.name}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>v{selectedPlugin?.version}</Text>
                        </div>
                    </div>
                }
                open={detailModalOpen}
                onCancel={() => {
                    setDetailModalOpen(false);
                    setSelectedPlugin(null);
                }}
                footer={
                    selectedPlugin && (
                        installedSlugs.has(selectedPlugin.slug) ? (
                            <Button
                                danger
                                onClick={() => handleUninstall(selectedPlugin)}
                                loading={uninstallPlugin.isPending}
                            >
                                Uninstall
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleInstall(selectedPlugin)}
                                loading={installPlugin.isPending}
                            >
                                Add to Workspace
                            </Button>
                        )
                    )
                }
                width={500}
            >
                {selectedPlugin && (
                    <div>
                        <Paragraph>{selectedPlugin.description || 'No description available.'}</Paragraph>

                        {selectedPlugin.capabilities && selectedPlugin.capabilities.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Text strong>Capabilities:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.capabilities.map((cap, idx) => (
                                        <Tag key={idx} style={{ marginBottom: 4 }}>
                                            {typeof cap === 'string' ? cap : cap.capability}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Text strong>
                                    <Tooltip title="Permissions this plugin requires">
                                        Permissions <InfoCircleOutlined />
                                    </Tooltip>
                                </Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.permissions.map((perm, idx) => (
                                        <Tag key={idx} color="orange" style={{ marginBottom: 4 }}>
                                            {typeof perm === 'string' ? perm : perm.permission}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.homepage_url && (
                            <div style={{ marginTop: 16 }}>
                                <a href={selectedPlugin.homepage_url} target="_blank" rel="noopener noreferrer">
                                    Visit Homepage →
                                </a>
                            </div>
                        )}

                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                            <Space>
                                <Text type="secondary">{selectedPlugin.install_count || 0} installs</Text>
                                {selectedPlugin.author && (
                                    <Text type="secondary">• by {(selectedPlugin.author as any).name || (selectedPlugin.author as any).username || 'Unknown'}</Text>
                                )}
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
