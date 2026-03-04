'use client';

import { useCreatePlugin, useDeletePlugin, useMyPlugins, useUpdatePlugin, useUploadPluginBundle } from '@/hooks/usePlugins';
import { CreatePluginRequest, Plugin, PluginStatus, UpdatePluginRequest } from '@/types';
import JSZip from 'jszip';
import { useRef, useState } from 'react';

import { PLUGIN_CAPABILITIES, PLUGIN_PERMISSIONS } from '@/constants/plugin';

import { Alert, Badge, Button, Card, Divider, Group, Loader, Modal, MultiSelect, Switch, Text, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCircleCheck, IconCloudUpload, IconEdit, IconPlus, IconSearch, IconTrash, IconUpload } from '@tabler/icons-react';

const STATUS_COLORS: Record<PluginStatus, string> = {
    draft: 'gray',
    review: 'yellow',
    published: 'green',
    suspended: 'red',
};

const CAPABILITIES = Object.values(PLUGIN_CAPABILITIES);
const PERMISSIONS = Object.values(PLUGIN_PERMISSIONS);

export default function MyPluginsPage() {
    const [pluginModalOpen, setPluginModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
    const [uploadingPlugin, setUploadingPlugin] = useState<Plugin | null>(null);
    const [searchText, setSearchText] = useState('');

    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [manifestParsed, setManifestParsed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const form = useForm({
        initialValues: {
            name: '',
            slug: '',
            version: '1.0.0',
            description: '',
            icon_url: '',
            homepage_url: '',
            capabilities: [] as string[],
            permissions: [] as string[],
            is_public: false,
        }
    });

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

    const resetForm = () => {
        form.reset();
        setUploadFile(null);
        setManifestParsed(false);
    };

    // Parse manifest.json from ZIP file and auto-fill form
    const parseManifestFromZip = async (file: File) => {
        try {
            const zip = await JSZip.loadAsync(file);
            const manifestFile = zip.file('manifest.json');

            if (!manifestFile) {
                notifications.show({ message: 'No manifest.json found in ZIP', color: 'yellow' });
                return;
            }

            const manifestContent = await manifestFile.async('string');
            const manifest = JSON.parse(manifestContent);

            form.setValues({
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
            notifications.show({ message: 'Plugin info extracted from manifest.json!', color: 'green' });
        } catch (error) {
            console.error('Failed to parse manifest:', error);
            notifications.show({ title: 'Error', message: 'Failed to parse manifest.json from ZIP', color: 'red' });
        }
    };

    const handleCreate = async (values: typeof form.values) => {
        try {
            const createValues: CreatePluginRequest = {
                name: values.name,
                slug: values.slug,
                version: values.version,
                description: values.description,
                icon_url: values.icon_url,
                homepage_url: values.homepage_url,
                manifest_url: '',
                client_url: '',
                capabilities: values.capabilities,
                permissions: values.permissions,
            };
            const plugin = await createPlugin.mutateAsync(createValues);

            if (uploadFile) {
                try {
                    await uploadBundle.mutateAsync({ id: plugin.id, file: uploadFile });
                    notifications.show({ message: 'Plugin submitted and bundle uploaded successfully!', color: 'green' });
                } catch {
                    notifications.show({ message: 'Plugin created but bundle upload failed. You can upload later.', color: 'yellow' });
                }
            } else {
                notifications.show({ message: 'Plugin submitted successfully! It will be reviewed by admins.', color: 'green' });
            }

            setPluginModalOpen(false);
            resetForm();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit plugin';
            notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
        }
    };

    const handleUpdate = async (values: typeof form.values) => {
        if (!editingPlugin) return;
        try {
            const updateValues: UpdatePluginRequest = {
                name: values.name,
                description: values.description,
                icon_url: values.icon_url,
                homepage_url: values.homepage_url,
                is_public: values.is_public,
            };
            await updatePlugin.mutateAsync({ id: editingPlugin.id, data: updateValues });
            notifications.show({ message: 'Plugin updated', color: 'green' });
            setPluginModalOpen(false);
            setEditingPlugin(null);
            resetForm();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update plugin';
            notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePlugin.mutateAsync(id);
            notifications.show({ message: 'Plugin deleted', color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to delete plugin', color: 'red' });
        }
    };

    const handleUploadBundle = async () => {
        if (!uploadingPlugin || !uploadFile) return;
        try {
            await uploadBundle.mutateAsync({ id: uploadingPlugin.id, file: uploadFile });
            notifications.show({ message: 'Plugin bundle uploaded successfully!', color: 'green' });
            setUploadModalOpen(false);
            setUploadingPlugin(null);
            setUploadFile(null);
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to upload bundle', color: 'red' });
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title order={2} style={{ margin: 0 }}>My Plugins</Title>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                        setEditingPlugin(null);
                        resetForm();
                        setPluginModalOpen(true);
                    }}
                >
                    Submit Plugin
                </Button>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Group wrap="wrap">
                    <TextInput
                        placeholder="Search plugins..."
                        leftSection={<IconSearch size={16} />}
                        value={searchText}
                        onChange={e => setSearchText(e.currentTarget.value)}
                        style={{ width: 300 }}
                    />
                    <Text c="dimmed">
                        {filteredPlugins.length} plugin(s)
                    </Text>
                </Group>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader size="lg" />
                    </div>
                ) : filteredPlugins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Text c="dimmed">No plugins yet. Submit your first plugin!</Text>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Plugin</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Version</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Installs</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)', width: 180 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlugins.map((record) => (
                                    <tr key={record.id}>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
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
                                                    <Text c="dimmed" style={{ fontSize: 12 }}>{record.slug}</Text>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{record.version}</td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Badge color={STATUS_COLORS[record.status]}>{record.status.toUpperCase()}</Badge>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Badge color="blue">{record.install_count}</Badge>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Group>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconUpload size={16} />}
                                                    onClick={() => {
                                                        setUploadingPlugin(record);
                                                        setUploadModalOpen(true);
                                                    }}
                                                >
                                                    Upload
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconEdit size={16} />}
                                                    onClick={() => {
                                                        setEditingPlugin(record);
                                                        form.setValues({
                                                            name: record.name,
                                                            slug: record.slug,
                                                            version: record.version,
                                                            description: record.description || '',
                                                            icon_url: record.icon_url || '',
                                                            homepage_url: record.homepage_url || '',
                                                            capabilities: record.capabilities?.map(c => c.capability) || [],
                                                            permissions: record.permissions?.map(p => p.permission) || [],
                                                            is_public: record.is_public || false,
                                                        });
                                                        setPluginModalOpen(true);
                                                    }}
                                                />
                                                {record.status !== 'published' && (
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        color="red"
                                                        leftSection={<IconTrash size={16} />}
                                                        onClick={() => handleDelete(record.id)}
                                                    />
                                                )}
                                            </Group>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Submit/Edit Plugin Modal */}
            <Modal
                title={editingPlugin ? 'Edit Plugin' : 'Submit New Plugin'}
                opened={pluginModalOpen}
                onClose={() => {
                    setPluginModalOpen(false);
                    setEditingPlugin(null);
                    resetForm();
                }}
                size="lg"
            >
                <form onSubmit={form.onSubmit((values) => editingPlugin ? handleUpdate(values) : handleCreate(values))}>
                    {/* Step 1: Upload Plugin Bundle */}
                    {!editingPlugin && (
                        <div>
                            <div
                                style={{
                                    border: '2px dashed var(--mantine-color-default-border)',
                                    borderRadius: 8,
                                    padding: 32,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'var(--mantine-color-default-hover)',
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file?.name.endsWith('.zip')) {
                                        setUploadFile(file);
                                        setManifestParsed(false);
                                        parseManifestFromZip(file);
                                    }
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setUploadFile(file);
                                            setManifestParsed(false);
                                            parseManifestFromZip(file);
                                        }
                                    }}
                                />
                                <IconCloudUpload size={32} color="var(--mantine-color-blue-6)" />
                                <Text mt="xs" fw={500}>
                                    {uploadFile ? uploadFile.name : 'Drag bundle here or click to select'}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    ZIP file containing: manifest.json, client.js
                                </Text>
                            </div>
                            {uploadFile && (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    size="xs"
                                    mt="xs"
                                    onClick={() => {
                                        setUploadFile(null);
                                        setManifestParsed(false);
                                        resetForm();
                                    }}
                                >
                                    Remove file
                                </Button>
                            )}
                            {uploadFile && manifestParsed && (
                                <Alert
                                    color="green"
                                    style={{ marginTop: 8 }}
                                >
                                    <Group gap="xs">
                                        <IconCircleCheck size={16} />
                                        <span>Plugin info extracted! Review and submit below.</span>
                                    </Group>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Step 2: Plugin Details */}
                    {(manifestParsed || editingPlugin) && (
                        <>
                            <Divider label="Plugin Details" mt="md" mb="md" />

                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                <TextInput
                                    label="Slug"
                                    placeholder="my-plugin"
                                    disabled={!!editingPlugin}
                                    {...form.getInputProps('slug')}
                                    style={{ flex: 1 }}
                                />
                                <TextInput
                                    label="Version"
                                    placeholder="1.0.0"
                                    disabled={!!editingPlugin}
                                    {...form.getInputProps('version')}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            <TextInput
                                label="Name"
                                placeholder="My Awesome Plugin"
                                disabled={!!editingPlugin}
                                {...form.getInputProps('name')}
                                mb="sm"
                            />

                            <Textarea
                                label="Description"
                                placeholder="What does your plugin do?"
                                rows={2}
                                {...form.getInputProps('description')}
                                mb="sm"
                            />

                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                <TextInput
                                    label="Icon URL"
                                    placeholder="https://your-plugin.com/icon.png"
                                    {...form.getInputProps('icon_url')}
                                    style={{ flex: 1 }}
                                />
                                <TextInput
                                    label="Homepage URL"
                                    placeholder="https://your-plugin.com"
                                    {...form.getInputProps('homepage_url')}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            {editingPlugin && (
                                <Switch
                                    label={form.values.is_public ? 'Public' : 'Private'}
                                    {...form.getInputProps('is_public', { type: 'checkbox' })}
                                    mb="sm"
                                />
                            )}

                            <Divider label="Capabilities & Permissions" mt="md" mb="md" />

                            <MultiSelect
                                label="Capabilities"
                                placeholder="Select capabilities"
                                data={CAPABILITIES}
                                {...form.getInputProps('capabilities')}
                                disabled={!!editingPlugin}
                                mb="sm"
                            />

                            <MultiSelect
                                label="Permissions"
                                placeholder="Select permissions"
                                data={PERMISSIONS}
                                {...form.getInputProps('permissions')}
                                disabled={!!editingPlugin}
                                mb="sm"
                            />

                            <div style={{ marginTop: 24 }}>
                                <Button
                                    type="submit"
                                    fullWidth
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
                </form>
            </Modal>

            {/* Upload Bundle Modal */}
            <Modal
                title="Upload Plugin Bundle"
                opened={uploadModalOpen}
                onClose={() => {
                    setUploadModalOpen(false);
                    setUploadingPlugin(null);
                    setUploadFile(null);
                }}
            >
                {uploadingPlugin && (
                    <>
                        <Text>Uploading bundle for: <strong>{uploadingPlugin.name}</strong></Text>

                        <div
                            style={{
                                border: '2px dashed var(--mantine-color-default-border)',
                                borderRadius: 8,
                                padding: 32,
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'var(--mantine-color-default-hover)',
                                marginTop: 16,
                            }}
                            onClick={() => uploadFileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file?.name.endsWith('.zip')) {
                                    setUploadFile(file);
                                }
                            }}
                        >
                            <input
                                ref={uploadFileInputRef}
                                type="file"
                                accept=".zip"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setUploadFile(file);
                                    }
                                }}
                            />
                            <IconCloudUpload size={32} color="var(--mantine-color-blue-6)" />
                            <Text mt="xs" fw={500}>
                                {uploadFile ? uploadFile.name : 'Click or drag ZIP file here'}
                            </Text>
                            <Text size="sm" c="dimmed">
                                Bundle must contain: manifest.json, client.js
                            </Text>
                        </div>

                        <Alert
                            color="blue"
                            style={{ marginTop: 16 }}
                        >
                            Uploading a new bundle will replace existing files and update plugin info from manifest.json
                        </Alert>

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setUploadModalOpen(false);
                                    setUploadingPlugin(null);
                                    setUploadFile(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUploadBundle}
                                loading={uploadBundle.isPending}
                                disabled={!uploadFile}
                            >
                                Upload
                            </Button>
                        </Group>
                    </>
                )}
            </Modal>
        </>
    );
}
