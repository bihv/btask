'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useBoardPlugins, useInstallPluginToBoard, usePublishedPlugins, useUninstallPluginFromBoard } from '@/hooks/usePlugins';
import { Plugin } from '@/types';
import { useState } from 'react';
import PluginSettingsModal from './PluginSettingsModal';

import { Avatar, Badge, Button, Card, Center, Group, Loader, Modal, SimpleGrid, Stack, Tabs, Text, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconPlus, IconSearch, IconSettings, IconTrash } from '@tabler/icons-react';

interface BoardPluginsModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
    workspaceId: string;
}

export default function BoardPluginsModal({ open, onClose, boardId, workspaceId }: BoardPluginsModalProps) {
    const t = useTranslation();
    const [activeTab, setActiveTab] = useState<string | null>('installed');
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
            notifications.show({ message: `${plugin.name} installed`, color: 'green' });
            setActiveTab('installed');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_INSTALL_PLUGIN_FAILED'), color: 'red' });
        }
    };

    const handleUninstall = async (installation: any) => {
        const isInherited = !!installation.workspace_id;
        if (isInherited) {
            notifications.show({ message: t('UI_WORKSPACE_PLUGIN_INFO'), color: 'blue' });
            return;
        }
        try {
            await uninstallPlugin.mutateAsync({ boardId, slug: installation.plugin.slug });
            notifications.show({ message: t('SUCCESS_PLUGIN_UNINSTALLED'), color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_UNINSTALL_PLUGIN_FAILED'), color: 'red' });
        }
    };

    return (
        <>
            <Modal
                opened={open}
                onClose={onClose}
                title={<Group><IconBolt size={20} /><Text fw={700}>{t('UI_PLUGINS')}</Text></Group>}
                size="lg"
            >
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="installed">{t('UI_INSTALLED')} ({installedPlugins.length})</Tabs.Tab>
                        <Tabs.Tab value="available">{t('UI_AVAILABLE')}</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="installed" pt="md">
                        {loadingInstalled ? (
                            <Center py="xl"><Loader size="sm" /></Center>
                        ) : installedPlugins.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">{t('UI_NO_PLUGINS_ENABLED')}</Text>
                        ) : (
                            <Stack gap={8}>
                                {installedPlugins.map((item: any) => {
                                    const isInherited = !!item.workspace_id;
                                    return (
                                        <Card key={item.id} withBorder>
                                            <Group justify="space-between">
                                                <Group>
                                                    <Avatar
                                                        src={item.plugin.icon_url}
                                                        radius="sm"
                                                        size="lg"
                                                        style={{ backgroundColor: isInherited ? '#8c8c8c' : '#1890ff' }}
                                                    />
                                                    <div>
                                                        <Group gap={4}>
                                                            <Text fw={700}>{item.plugin.name}</Text>
                                                            {isInherited && <Badge color="blue">Workspace</Badge>}
                                                            {!isInherited && <Badge color="cyan">Board</Badge>}
                                                        </Group>
                                                        <Text c="dimmed" size="sm">{item.plugin.description}</Text>
                                                    </div>
                                                </Group>
                                                <Group gap={4}>
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        leftSection={<IconSettings size={14} />}
                                                        onClick={() => {
                                                            setSelectedPlugin(item);
                                                            setSettingsOpen(true);
                                                        }}
                                                    >
                                                        {t('UI_SETTINGS')}
                                                    </Button>
                                                    {isInherited ? (
                                                        <Tooltip label={t('UI_WORKSPACE_INHERITED')}>
                                                            <Button size="xs" variant="subtle" disabled leftSection={<IconTrash size={14} />} />
                                                        </Tooltip>
                                                    ) : (
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            color="red"
                                                            leftSection={<IconTrash size={14} />}
                                                            onClick={() => handleUninstall(item)}
                                                            loading={uninstallPlugin.isPending && uninstallPlugin.variables?.slug === item.plugin.slug}
                                                        />
                                                    )}
                                                </Group>
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="available" pt="md">
                        <TextInput
                            placeholder={t('UI_PLACEHOLDER_SEARCH_PLUGINS')}
                            leftSection={<IconSearch size={16} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            mb={16}
                        />
                        {loadingAvailable ? (
                            <Center py="xl"><Loader size="sm" /></Center>
                        ) : filteredAvailable.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">{t('UI_NO_NEW_PLUGINS')}</Text>
                        ) : (
                            <SimpleGrid cols={2} spacing="md">
                                {filteredAvailable.map((plugin: Plugin) => (
                                    <Card key={plugin.slug} withBorder>
                                        <Group justify="space-between" mb={8}>
                                            <Group>
                                                <Avatar src={plugin.icon_url} radius="sm" size="md" />
                                                <Text fw={700}>{plugin.name}</Text>
                                            </Group>
                                            <Button
                                                size="xs"
                                                leftSection={<IconPlus size={14} />}
                                                onClick={() => handleInstall(plugin)}
                                                loading={installPlugin.isPending && installPlugin.variables?.slug === plugin.slug}
                                            >
                                                {t('UI_INSTALL')}
                                            </Button>
                                        </Group>
                                        <Text c="dimmed" size="sm" lineClamp={2}>{plugin.description}</Text>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        )}
                    </Tabs.Panel>
                </Tabs>
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
