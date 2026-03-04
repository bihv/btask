'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useAdminPlugins, useHardDeletePlugin, useUpdatePluginStatus } from '@/hooks/usePlugins';
import { useAuthStore } from '@/stores/authStore';
import { Plugin, PluginStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge, Button, Card, Group, Loader, Modal, Pagination, Select, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconSearch, IconTrash } from '@tabler/icons-react';
const STATUS_COLORS: Record<PluginStatus, string> = {
    draft: 'gray',
    review: 'blue',
    published: 'green',
    suspended: 'red',
};

const STATUS_OPTIONS: { value: PluginStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'Review' },
    { value: 'published', label: 'Published' },
    { value: 'suspended', label: 'Suspended' },
];

export default function AdminPluginsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const t = useTranslation();
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<PluginStatus | 'all'>('all');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // React Query hooks
    const { data, isLoading } = useAdminPlugins({
        page,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter,
    });

    const plugins = data?.plugins || [];
    const total = data?.total || 0;

    const updateStatus = useUpdatePluginStatus();
    const hardDelete = useHardDeletePlugin();

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    const handleUpdateStatus = async (id: string, status: PluginStatus) => {
        try {
            await updateStatus.mutateAsync({ id, status });
            notifications.show({ message: `Plugin status updated to ${status}`, color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_PLUGIN_STATUS'), color: 'red' });
        }
    };

    const handleHardDelete = async (plugin: Plugin) => {
        try {
            await hardDelete.mutateAsync(plugin.id);
            notifications.show({ message: `Plugin "${plugin.name}" has been permanently deleted`, color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_DELETE_PLUGIN'), color: 'red' });
        }
    };

    const renderPluginRow = (record: Plugin) => (
        <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {record.icon_url && (
                        <img src={record.icon_url} alt={record.name} style={{ width: 24, height: 24, borderRadius: 4 }} />
                    )}
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <Text c="dimmed" style={{ fontSize: 12 }}>{record.slug}</Text>
                    </div>
                </div>
            </td>
            <td style={{ padding: '8px' }}>{record.author?.full_name || '-'}</td>
            <td style={{ padding: '8px' }}>{record.version}</td>
            <td style={{ padding: '8px' }}><Badge color="blue">{record.install_count}</Badge></td>
            <td style={{ padding: '8px' }}>{new Date(record.created_at).toLocaleDateString()}</td>
            <td style={{ padding: '8px' }}>
                <Group>
                    <Button
                        size="sm"
                        leftSection={<IconEye size={16} />}
                        onClick={() => {
                            setSelectedPlugin(record);
                            setDetailModalOpen(true);
                        }}
                    />
                    <Select
                        size="sm"
                        value={record.status}
                        onChange={(status) => { if (status) handleUpdateStatus(record.id, status as PluginStatus); }}
                        data={STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => ({ value: o.value, label: o.label }))}
                        style={{ width: 110 }}
                    />
                    <Button
                        size="sm"
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => {
                            if (window.confirm(`Permanently delete "${record.name}"? This will delete all plugin files, data, settings, and installations. This action cannot be undone!`)) {
                                handleHardDelete(record);
                            }
                        }}
                    />
                </Group>
            </td>
        </tr>
    );

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title order={2} style={{ margin: 0 }}>{t('UI_PLUGINS')}</Title>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Group wrap="wrap">
                    <TextInput
                        placeholder={t('UI_SEARCH_PLUGINS')}
                        leftSection={<IconSearch size={16} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}

                    />
                    <Select
                        value={statusFilter}
                        onChange={(val) => setStatusFilter((val || 'all') as PluginStatus | 'all')}
                        data={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                        style={{ width: 150 }}
                    />
                    <Text c="dimmed">
                        Showing {plugins.length} of {total} plugins
                    </Text>
                </Group>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_NAME')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_AUTHOR')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_VERSION')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_INSTALLS')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_CREATED')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left', width: 200 }}>{t('UI_ACTIONS')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plugins.map(renderPluginRow)}
                                </tbody>
                            </table>
                        </div>
                        {total > pageSize && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    total={Math.ceil(total / pageSize)}
                                    value={page}
                                    onChange={(newPage: number) => setPage(newPage)}
                                />
                            </Group>
                        )}
                    </>
                )}
            </Card>

            <Modal
                title={t('UI_PLUGIN_DETAILS')}
                opened={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedPlugin(null);
                }}
                size="lg"
            >
                {selectedPlugin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {selectedPlugin.icon_url && (
                                <img
                                    src={selectedPlugin.icon_url}
                                    alt={selectedPlugin.name}
                                    style={{ width: 48, height: 48, borderRadius: 8 }}
                                />
                            )}
                            <div>
                                <Title order={4} style={{ margin: 0 }}>{selectedPlugin.name}</Title>
                                <Text c="dimmed">{selectedPlugin.slug} v{selectedPlugin.version}</Text>
                            </div>
                            <Badge color={STATUS_COLORS[selectedPlugin.status]} style={{ marginLeft: 'auto' }}>
                                {selectedPlugin.status.toUpperCase()}
                            </Badge>
                        </div>

                        <div>
                            <Text fw={700}>{t('UI_DESCRIPTION')}:</Text>
                            <p>{selectedPlugin.description || 'No description'}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <Text c="dimmed">{t('UI_AUTHOR')}</Text>
                                <div>{selectedPlugin.author?.full_name || '-'}</div>
                            </div>
                            <div>
                                <Text c="dimmed">{t('UI_INSTALLS')}</Text>
                                <div>{selectedPlugin.install_count}</div>
                            </div>
                            <div>
                                <Text c="dimmed">{t('UI_PRICING')}</Text>
                                <div>{selectedPlugin.pricing_type}</div>
                            </div>
                            <div>
                                <Text c="dimmed">{t('UI_PUBLIC')}</Text>
                                <div>{selectedPlugin.is_public ? t('UI_YES') : t('UI_NO')}</div>
                            </div>
                        </div>

                        <div>
                            <Text fw={700}>{t('UI_URLS')}:</Text>
                            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                                <li><Text c="dimmed">{t('UI_MANIFEST')}:</Text> <a href={selectedPlugin.manifest_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.manifest_url}</a></li>
                                <li><Text c="dimmed">{t('UI_CLIENT')}:</Text> <a href={selectedPlugin.client_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.client_url}</a></li>
                                {selectedPlugin.server_url && <li><Text c="dimmed">{t('UI_SERVER')}:</Text> <a href={selectedPlugin.server_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.server_url}</a></li>}
                                {selectedPlugin.homepage_url && <li><Text c="dimmed">{t('UI_HOMEPAGE')}:</Text> <a href={selectedPlugin.homepage_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.homepage_url}</a></li>}
                            </ul>
                        </div>

                        {selectedPlugin.capabilities && selectedPlugin.capabilities.length > 0 && (
                            <div>
                                <Text fw={700}>{t('UI_CAPABILITIES')}:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.capabilities.map(cap => (
                                        <Badge key={cap.id}>{cap.capability}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
                            <div>
                                <Text fw={700}>{t('UI_PERMISSIONS')}:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.permissions.map(perm => (
                                        <Badge key={perm.id} color="orange">{perm.permission}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </Modal>
        </>
    );
}
