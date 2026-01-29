'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Input, Modal, Form, Typography, Card, Spin, Tag, Space, App, Select } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useAdminPlugins, useUpdatePluginStatus, useHardDeletePlugin } from '@/hooks/usePlugins';
import { Plugin, PluginStatus } from '@/types';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<PluginStatus, string> = {
    draft: 'default',
    review: 'processing',
    published: 'success',
    suspended: 'error',
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
    const { message, modal } = App.useApp();
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
            message.success(`Plugin status updated to ${status}`);
        } catch {
            message.error('Failed to update plugin status');
        }
    };

    const handleHardDelete = async (plugin: Plugin) => {
        try {
            await hardDelete.mutateAsync(plugin.id);
            message.success(`Plugin "${plugin.name}" has been permanently deleted`);
        } catch {
            message.error('Failed to delete plugin');
        }
    };

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: unknown, record: Plugin) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {record.icon_url && (
                        <img
                            src={record.icon_url}
                            alt={record.name}
                            style={{ width: 24, height: 24, borderRadius: 4 }}
                        />
                    )}
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.slug}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Author',
            key: 'author',
            render: (_: unknown, record: Plugin) => record.author?.full_name || '-',
        },
        {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
        },

        {
            title: 'Installs',
            dataIndex: 'install_count',
            key: 'install_count',
            render: (count: number) => <Tag color="blue">{count}</Tag>,
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_: unknown, record: Plugin) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedPlugin(record);
                            setDetailModalOpen(true);
                        }}
                    />
                    <Select
                        size="small"
                        value={record.status}
                        onChange={(status) => handleUpdateStatus(record.id, status)}
                        options={STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => ({ value: o.value, label: o.label }))}
                        style={{ width: 110 }}
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            modal.confirm({
                                title: 'Permanently delete this plugin?',
                                content: (
                                    <div>
                                        <p>This action will:</p>
                                        <ul style={{ marginLeft: 20 }}>
                                            <li>Delete all plugin files</li>
                                            <li>Delete all plugin data and settings</li>
                                            <li>Remove all installations</li>
                                        </ul>
                                        <p><strong>This action cannot be undone!</strong></p>
                                    </div>
                                ),
                                okText: 'Delete Permanently',
                                okType: 'danger',
                                onOk: () => handleHardDelete(record),
                            });
                        }}
                    />
                </Space>
            ),
        },
    ];

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>Plugins</Title>
            </div>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Search plugins..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={STATUS_OPTIONS}
                        style={{ width: 150 }}
                    />
                    <Text type="secondary">
                        Showing {plugins.length} of {total} plugins
                    </Text>
                </Space>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        dataSource={plugins}
                        columns={columns}
                        rowKey="id"
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} plugins`,
                            onChange: (newPage, newPageSize) => {
                                setPage(newPage);
                                if (newPageSize !== pageSize) {
                                    setPageSize(newPageSize);
                                    setPage(1);
                                }
                            },
                        }}
                    />
                )}
            </Card>

            <Modal
                title="Plugin Details"
                open={detailModalOpen}
                onCancel={() => {
                    setDetailModalOpen(false);
                    setSelectedPlugin(null);
                }}
                footer={null}
                width={600}
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
                                <Title level={4} style={{ margin: 0 }}>{selectedPlugin.name}</Title>
                                <Text type="secondary">{selectedPlugin.slug} v{selectedPlugin.version}</Text>
                            </div>
                            <Tag color={STATUS_COLORS[selectedPlugin.status]} style={{ marginLeft: 'auto' }}>
                                {selectedPlugin.status.toUpperCase()}
                            </Tag>
                        </div>

                        <div>
                            <Text strong>Description:</Text>
                            <p>{selectedPlugin.description || 'No description'}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <Text type="secondary">Author</Text>
                                <div>{selectedPlugin.author?.full_name || '-'}</div>
                            </div>
                            <div>
                                <Text type="secondary">Installs</Text>
                                <div>{selectedPlugin.install_count}</div>
                            </div>
                            <div>
                                <Text type="secondary">Pricing</Text>
                                <div>{selectedPlugin.pricing_type}</div>
                            </div>
                            <div>
                                <Text type="secondary">Public</Text>
                                <div>{selectedPlugin.is_public ? 'Yes' : 'No'}</div>
                            </div>
                        </div>

                        <div>
                            <Text strong>URLs:</Text>
                            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                                <li><Text type="secondary">Manifest:</Text> <a href={selectedPlugin.manifest_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.manifest_url}</a></li>
                                <li><Text type="secondary">Client:</Text> <a href={selectedPlugin.client_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.client_url}</a></li>
                                {selectedPlugin.server_url && <li><Text type="secondary">Server:</Text> <a href={selectedPlugin.server_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.server_url}</a></li>}
                                {selectedPlugin.homepage_url && <li><Text type="secondary">Homepage:</Text> <a href={selectedPlugin.homepage_url} target="_blank" rel="noopener noreferrer">{selectedPlugin.homepage_url}</a></li>}
                            </ul>
                        </div>

                        {selectedPlugin.capabilities && selectedPlugin.capabilities.length > 0 && (
                            <div>
                                <Text strong>Capabilities:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.capabilities.map(cap => (
                                        <Tag key={cap.id}>{cap.capability}</Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
                            <div>
                                <Text strong>Permissions:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {selectedPlugin.permissions.map(perm => (
                                        <Tag key={perm.id} color="orange">{perm.permission}</Tag>
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
