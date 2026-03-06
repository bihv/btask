'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useInstallPluginToWorkspace, usePublishedPlugins, useUninstallPluginFromWorkspace, useWorkspacePlugins } from '@/hooks/usePlugins';
import { Plugin, PluginInstallation } from '@/types';
import { useState } from 'react';

import { Alert, Avatar, Badge, Card, Group, Loader, Modal, SimpleGrid, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconCircleCheck, IconInfoCircle, IconSearch } from '@tabler/icons-react';
interface WorkspacePowerUpsProps {
    workspace: {
        id: string;
        name: string;
    };
}

export default function WorkspacePowerUps({ workspace }: WorkspacePowerUpsProps) {
    const t = useTranslation();
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
            notifications.show({ message: `${plugin.name} installed successfully!`, color: 'green' });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || t('ERROR_INSTALL_PLUGIN');
            notifications.show({ title: 'Error', message: errorMsg, color: 'red' });
            console.error('Install failed:', error);
        }
    };

    const handleUninstall = async (plugin: Plugin, slug?: string) => {
        const pluginSlug = slug || plugin.slug;
        /* TODO: implement confirmation dialog */ ({
            title: `Uninstall ${plugin.name}?`,
            content: t('UI_UNINSTALL_CONFIRM'),
            okText: t('UI_UNINSTALL'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await uninstallPlugin.mutateAsync({ workspaceId: workspace.id, slug: pluginSlug });
                    notifications.show({ message: `${plugin.name} uninstalled`, color: 'green' });
                } catch {
                    notifications.show({ title: 'Error', message: t('ERROR_UNINSTALL_PLUGIN'), color: 'red' });
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
                <Loader size="lg" />
                <div style={{ marginTop: 16 }}>{t('UI_LOADING_POWERUPS')}</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title order={3} style={{ margin: 0 }}>
                        <IconBolt size={16} /> {t('UI_POWERUPS')}
                    </Title>
                    <Text c="dimmed">{t('UI_POWERUPS_DESC')}</Text>
                </div>
            </div>

            <Alert icon={<IconInfoCircle size={16} />} title={t('UI_WORKSPACE_PLUGIN_INFO')} color="blue" variant="light" mb={24}>
                {t('UI_PLUGIN_WORKSPACE_SCOPE_INFO')}
            </Alert>

            {/* Search */}
            <Card style={{ marginBottom: 24 }}>
                <TextInput
                    placeholder={t('UI_SEARCH_POWERUPS')}
                    leftSection={<IconSearch size={16} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ maxWidth: 400 }}

                />
            </Card>

            {/* Installed Plugins Section */}
            {installedPlugins.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <Title order={5} style={{ marginBottom: 16 }}>
                        <IconCircleCheck size={16} style={{ color: '#52c41a', marginRight: 8 }} />
                        {t('UI_ENABLED')} ({installedPlugins.length})
                    </Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                        {installedPlugins.map((installation: PluginInstallation) => (
                            <div>
                                <Card

                                    withBorder
                                    style={{ height: '100%', borderColor: '#52c41a' }}
                                    onClick={() => installation.plugin && showPluginDetails(installation.plugin)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <Avatar
                                            src={installation.plugin?.icon_url}

                                            size={48}
                                            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{installation.plugin?.name}</div>
                                            <Text
                                                c="dimmed"
                                                lineClamp={2}
                                                style={{ marginBottom: 8, fontSize: 12 }}
                                            >
                                                {installation.plugin?.description || t('UI_NO_DESCRIPTION')}
                                            </Text>
                                            <Badge color="green" style={{ margin: 0 }}>{t('UI_ENABLED')}</Badge>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </SimpleGrid>
                </div>
            )}

            {/* Available Plugins Section */}
            <div>
                <Title order={5} style={{ marginBottom: 16 }}>
                    {t('UI_AVAILABLE_POWERUPS')} ({filteredPlugins.filter((p: Plugin) => !installedSlugs.has(p.slug)).length})
                </Title>

                {filteredPlugins.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">{t('UI_NO_POWERUPS')}</Text>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                        {filteredPlugins
                            .filter((plugin: Plugin) => !installedSlugs.has(plugin.slug))
                            .map((plugin: Plugin) => (
                                <div>
                                    <Card

                                        withBorder
                                        style={{ height: '100%' }}
                                        onClick={() => showPluginDetails(plugin)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            <Avatar
                                                src={plugin.icon_url}

                                                size={48}
                                                style={{ backgroundColor: '#8c8c8c', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{plugin.name}</div>
                                                <Text
                                                    c="dimmed"
                                                    lineClamp={2}
                                                    style={{ marginBottom: 8, fontSize: 12 }}
                                                >
                                                    {plugin.description || t('UI_NO_DESCRIPTION')}
                                                </Text>
                                                <Group gap={4}>
                                                    <Badge>{plugin.version}</Badge>
                                                    {plugin.install_count > 0 && (
                                                        <Badge color="blue">{plugin.install_count} installs</Badge>
                                                    )}
                                                </Group>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                    </SimpleGrid>
                )}
            </div>

            {/* Plugin Detail Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                            src={selectedPlugin?.icon_url}

                            size={40}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                        <div>
                            <div style={{ fontWeight: 600 }}>{selectedPlugin?.name}</div>
                            <Text c="dimmed" style={{ fontSize: 12 }}>v{selectedPlugin?.version}</Text>
                        </div>
                    </div>
                }
                opened={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedPlugin(null);
                }}
                size="md"
            >
                {selectedPlugin && (
                    <div>
                        <Text>{selectedPlugin.description || t('UI_NO_DESCRIPTION')}</Text>

                        {selectedPlugin.capabilities && selectedPlugin.capabilities.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Text fw={700}>{t('UI_CAPABILITIES')}</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.capabilities.map((cap, idx) => (
                                        <Badge key={idx} style={{ marginBottom: 4 }}>
                                            {typeof cap === 'string' ? cap : cap.capability}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Text fw={700}>
                                    <Tooltip label={t('UI_PERMISSIONS_TOOLTIP')}>
                                        {t('UI_PERMISSIONS')} <IconInfoCircle size={16} />
                                    </Tooltip>
                                </Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.permissions.map((perm, idx) => (
                                        <Badge key={idx} color="orange" style={{ marginBottom: 4 }}>
                                            {typeof perm === 'string' ? perm : perm.permission}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.homepage_url && (
                            <div style={{ marginTop: 16 }}>
                                <a href={selectedPlugin.homepage_url} target="_blank" rel="noopener noreferrer">
                                    {t('UI_VISIT_HOMEPAGE')}
                                </a>
                            </div>
                        )}

                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                            <Group>
                                <Text c="dimmed">{selectedPlugin.install_count || 0} installs</Text>
                                {selectedPlugin.author && (
                                    <Text c="dimmed">• by {(selectedPlugin.author as any).name || (selectedPlugin.author as any).username || 'Unknown'}</Text>
                                )}
                            </Group>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
