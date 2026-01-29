'use client';

import { useState } from 'react';
import { Table, Button, Input, Modal, Form, Typography, Card, Spin, Tag, Space, App, Select, Divider, Upload, Radio, Alert, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, CloudUploadOutlined, LinkOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMyPlugins, useCreatePlugin, useUpdatePlugin, useDeletePlugin, useUploadPluginBundle } from '@/hooks/usePlugins';
import { Plugin, PluginStatus, CreatePluginRequest, UpdatePluginRequest } from '@/types';
import JSZip from 'jszip';

const { Title, Text } = Typography;

import { PLUGIN_CAPABILITIES, PLUGIN_PERMISSIONS } from '@/constants/plugin';

const STATUS_COLORS: Record<PluginStatus, string> = {
    draft: 'default',
    review: 'processing',
    published: 'success',
    suspended: 'error',
};

const CAPABILITIES = Object.values(PLUGIN_CAPABILITIES);

const PERMISSIONS = Object.values(PLUGIN_PERMISSIONS);

export default function MyPluginsPage() {
    const { message, modal } = App.useApp();
    const [pluginModalOpen, setPluginModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
    const [uploadingPlugin, setUploadingPlugin] = useState<Plugin | null>(null);
    const [pluginForm] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [manifestParsed, setManifestParsed] = useState(false);

    // React Query hooks
    const { data: plugins = [], isLoading } = useMyPlugins();
    const createPlugin = useCreatePlugin();
    const updatePlugin = useUpdatePlugin();
    const deletePlugin = useDeletePlugin();
    const uploadBundle = useUploadPluginBundle();

    const filteredPlugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchText.toLowerCase())
    );

    // Parse manifest.json from ZIP file and auto-fill form
    const parseManifestFromZip = async (file: File) => {
        try {
            const zip = await JSZip.loadAsync(file);
            const manifestFile = zip.file('manifest.json');

            if (!manifestFile) {
                message.warning('No manifest.json found in ZIP');
                return;
            }

            const manifestContent = await manifestFile.async('string');
            const manifest = JSON.parse(manifestContent);

            // Auto-fill form fields from manifest
            pluginForm.setFieldsValue({
                name: manifest.name || '',
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                slug: manifest.id || manifest.slug || manifest.name?.toLowerCase().replace(/\s+/g, '-') || '',
                capabilities: manifest.capabilities || [],
                permissions: manifest.permissions || [],
                icon_url: manifest.icon || manifest.icon_url || '',
                homepage_url: manifest.homepage || manifest.homepage_url || '',
            });

            setManifestParsed(true);
            message.success('Plugin info extracted from manifest.json!');
        } catch (error) {
            console.error('Failed to parse manifest:', error);
            message.error('Failed to parse manifest.json from ZIP');
        }
    };

    const handleCreate = async (values: CreatePluginRequest) => {
        try {
            const plugin = await createPlugin.mutateAsync(values);

            if (uploadFile) {
                // Auto upload bundle after creating plugin
                try {
                    await uploadBundle.mutateAsync({ id: plugin.id, file: uploadFile });
                    message.success('Plugin submitted and bundle uploaded successfully!');
                } catch {
                    message.warning('Plugin created but bundle upload failed. You can upload later.');
                }
            } else {
                message.success('Plugin submitted successfully! It will be reviewed by admins.');
            }

            setPluginModalOpen(false);
            pluginForm.resetFields();
            setUploadFile(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit plugin';
            message.error(errorMessage);
        }
    };

    const handleUpdate = async (values: UpdatePluginRequest) => {
        if (!editingPlugin) return;
        try {
            await updatePlugin.mutateAsync({ id: editingPlugin.id, data: values });
            message.success('Plugin updated');
            setPluginModalOpen(false);
            setEditingPlugin(null);
            pluginForm.resetFields();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update plugin';
            message.error(errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePlugin.mutateAsync(id);
            message.success('Plugin deleted');
        } catch {
            message.error('Failed to delete plugin');
        }
    };

    const handleUploadBundle = async () => {
        if (!uploadingPlugin || !uploadFile) return;
        try {
            await uploadBundle.mutateAsync({ id: uploadingPlugin.id, file: uploadFile });
            message.success('Plugin bundle uploaded successfully!');
            setUploadModalOpen(false);
            setUploadingPlugin(null);
            setUploadFile(null);
        } catch {
            message.error('Failed to upload bundle');
        }
    };

    const columns = [
        {
            title: 'Plugin',
            key: 'name',
            render: (_: unknown, record: Plugin) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {record.icon_url && (
                        <img
                            src={record.icon_url}
                            alt={record.name}
                            style={{ width: 32, height: 32, borderRadius: 4 }}
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
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: PluginStatus) => (
                <Tag color={STATUS_COLORS[status]}>{status.toUpperCase()}</Tag>
            ),
        },

        {
            title: 'Installs',
            dataIndex: 'install_count',
            key: 'install_count',
            render: (count: number) => <Tag color="blue">{count}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 180,
            render: (_: unknown, record: Plugin) => (
                <Space>
                    <>
                        <Button
                            size="small"
                            icon={<UploadOutlined />}
                            onClick={() => {
                                setUploadingPlugin(record);
                                setUploadModalOpen(true);
                            }}
                        >
                            Upload
                        </Button>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingPlugin(record);
                                pluginForm.setFieldsValue({
                                    ...record,
                                    capabilities: record.capabilities?.map(c => c.capability) || [],
                                    permissions: record.permissions?.map(p => p.permission) || [],
                                });
                                setPluginModalOpen(true);
                            }}
                        />
                        {record.status !== 'published' && (
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    modal.confirm({
                                        title: 'Delete this plugin?',
                                        content: 'This action cannot be undone.',
                                        okText: 'Delete',
                                        okType: 'danger',
                                        onOk: () => handleDelete(record.id),
                                    });
                                }}
                            />
                        )}
                    </>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>My Plugins</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingPlugin(null);
                        pluginForm.resetFields();
                        setUploadFile(null);
                        setManifestParsed(false);
                        setPluginModalOpen(true);
                    }}
                >
                    Submit Plugin
                </Button>
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
                    <Text type="secondary">
                        {filteredPlugins.length} plugin(s)
                    </Text>
                </Space>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : filteredPlugins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Text type="secondary">No plugins yet. Submit your first plugin!</Text>
                    </div>
                ) : (
                    <Table
                        dataSource={filteredPlugins}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                    />
                )}
            </Card>

            {/* Submit/Edit Plugin Modal */}
            <Modal
                title={editingPlugin ? 'Edit Plugin' : 'Submit New Plugin'}
                open={pluginModalOpen}
                onCancel={() => {
                    setPluginModalOpen(false);
                    setEditingPlugin(null);
                    pluginForm.resetFields();
                    setUploadFile(null);
                }}
                footer={null}
                width={700}
            >
                <Form
                    form={pluginForm}
                    layout="vertical"
                    onFinish={editingPlugin ? handleUpdate : handleCreate}
                >
                    {/* Step 1: Upload Plugin Bundle */}
                    {!editingPlugin && (
                        <Form.Item label="Plugin Bundle (.zip)" required>
                            <Upload.Dragger
                                accept=".zip"
                                maxCount={1}
                                beforeUpload={(file) => {
                                    setUploadFile(file);
                                    setManifestParsed(false);
                                    parseManifestFromZip(file);
                                    return false;
                                }}
                                onRemove={() => {
                                    setUploadFile(null);
                                    setManifestParsed(false);
                                    pluginForm.resetFields();
                                }}
                                fileList={uploadFile ? [{ uid: '1', name: uploadFile.name, status: 'done' }] : []}
                            >
                                <p className="ant-upload-drag-icon">
                                    <CloudUploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                </p>
                                <p className="ant-upload-text">Dragger bundle here</p>
                                <p className="ant-upload-hint">
                                    ZIP file containing: manifest.json, client.js
                                </p>
                            </Upload.Dragger>
                            {uploadFile && manifestParsed && (
                                <Alert
                                    type="success"
                                    message={<><CheckCircleOutlined /> Plugin info extracted! Review and submit below.</>}
                                    style={{ marginTop: 8 }}
                                />
                            )}
                        </Form.Item>
                    )}

                    {/* Step 2: Plugin Details */}
                    {(manifestParsed || editingPlugin) && (
                        <>
                            <Divider>Plugin Details</Divider>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <Form.Item
                                    name="slug"
                                    label="Slug"
                                    rules={[{ required: true }, { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens' }]}
                                    style={{ flex: 1 }}
                                >
                                    <Input placeholder="my-plugin" disabled={!!editingPlugin} />
                                </Form.Item>
                                <Form.Item name="version" label="Version" rules={[{ required: true }]} style={{ flex: 1 }}>
                                    <Input placeholder="1.0.0" disabled={!!editingPlugin} />
                                </Form.Item>
                            </div>

                            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                <Input placeholder="My Awesome Plugin" disabled={!!editingPlugin} />
                            </Form.Item>

                            <Form.Item name="description" label="Description">
                                <Input.TextArea placeholder="What does your plugin do?" rows={2} />
                            </Form.Item>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <Form.Item name="icon_url" label="Icon URL" style={{ flex: 1 }}>
                                    <Input placeholder="https://your-plugin.com/icon.png" />
                                </Form.Item>
                                <Form.Item name="homepage_url" label="Homepage URL" style={{ flex: 1 }}>
                                    <Input placeholder="https://your-plugin.com" />
                                </Form.Item>
                            </div>

                            {editingPlugin && (
                                <Form.Item name="is_public" valuePropName="checked" label="Public Visibility" tooltip="Public plugins are visible to everyone in the marketplace. Private plugins are only visible to you.">
                                    <Switch checkedChildren="Public" unCheckedChildren="Private" />
                                </Form.Item>
                            )}

                            <Divider>Capabilities & Permissions</Divider>

                            <Form.Item name="capabilities" label="Capabilities" tooltip={editingPlugin ? "To change capabilities, please upload a new version." : undefined}>
                                <Select
                                    mode="multiple"
                                    placeholder="Select capabilities"
                                    options={CAPABILITIES.map(c => ({ value: c, label: c }))}
                                    disabled={!!editingPlugin}
                                />
                            </Form.Item>

                            <Form.Item name="permissions" label="Permissions" tooltip={editingPlugin ? "To change permissions, please upload a new version." : undefined}>
                                <Select
                                    mode="multiple"
                                    placeholder="Select permissions"
                                    options={PERMISSIONS.map(p => ({ value: p, label: p }))}
                                    disabled={!!editingPlugin}
                                />
                            </Form.Item>

                            <div style={{ marginTop: 24 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={createPlugin.isPending || updatePlugin.isPending || uploadBundle.isPending}
                                >
                                    {editingPlugin ? 'Update Plugin' : 'Submit Plugin'}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Placeholder message when no file yet */}
                    {!manifestParsed && !editingPlugin && !uploadFile && (
                        <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                            Upload a ZIP file to get started
                        </div>
                    )}
                </Form>
            </Modal>

            {/* Upload Bundle Modal */}
            <Modal
                title="Upload Plugin Bundle"
                open={uploadModalOpen}
                onCancel={() => {
                    setUploadModalOpen(false);
                    setUploadingPlugin(null);
                    setUploadFile(null);
                }}
                onOk={handleUploadBundle}
                okText="Upload"
                okButtonProps={{
                    loading: uploadBundle.isPending,
                    disabled: !uploadFile
                }}
            >
                {uploadingPlugin && (
                    <>
                        <Text>Uploading bundle for: <strong>{uploadingPlugin.name}</strong></Text>

                        <Upload.Dragger
                            accept=".zip"
                            maxCount={1}
                            beforeUpload={(file) => {
                                setUploadFile(file);
                                return false;
                            }}
                            onRemove={() => setUploadFile(null)}
                            fileList={uploadFile ? [{ uid: '1', name: uploadFile.name, status: 'done' }] : []}
                            style={{ marginTop: 16 }}
                        >
                            <p className="ant-upload-drag-icon">
                                <CloudUploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag ZIP file here</p>
                            <p className="ant-upload-hint">
                                Bundle must contain: manifest.json, client.js
                            </p>
                        </Upload.Dragger>

                        <Alert
                            type="info"
                            message="Uploading a new bundle will replace existing files and update plugin info from manifest.json"
                            style={{ marginTop: 16 }}
                        />
                    </>
                )}
            </Modal>
        </>
    );
}
