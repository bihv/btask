'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Typography,
    Card,
    Spin,
    Form,
    InputNumber,
    Switch,
    Button,
    App,
    Descriptions,
    Divider,
    Alert,
    Tag,
    Input,
    Space,
} from 'antd';
import {
    SettingOutlined,
    ClockCircleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    PlusOutlined,
    FileOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings, useUpdateSystemSettings, useRunCleanup, AllowedFileTypesConfig } from '@/hooks/useAdmin';

const { Title, Text } = Typography;

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const { data: settings, isLoading, refetch } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const runCleanup = useRunCleanup();

    // File types state
    const [allowedPrefixes, setAllowedPrefixes] = useState<string[]>([]);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [blockedTypes, setBlockedTypes] = useState<string[]>([]);
    const [inputPrefix, setInputPrefix] = useState('');
    const [inputType, setInputType] = useState('');
    const [inputBlocked, setInputBlocked] = useState('');
    const inputPrefixRef = useRef<HTMLInputElement>(null);
    const inputTypeRef = useRef<HTMLInputElement>(null);
    const inputBlockedRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (settings) {
            form.setFieldsValue({
                orphan_cleanup_days: settings.orphan_cleanup_days,
                orphan_cleanup_enabled: settings.orphan_cleanup_enabled,
                max_upload_size_mb: settings.max_upload_size_mb,
            });
            // Initialize file types state
            setAllowedPrefixes(settings.allowed_file_types?.allowed_prefixes || []);
            setAllowedTypes(settings.allowed_file_types?.allowed_types || []);
            setBlockedTypes(settings.allowed_file_types?.blocked_types || []);
        }
    }, [settings, form]);

    const handleSubmit = async (values: {
        orphan_cleanup_days: number;
        orphan_cleanup_enabled: boolean;
        max_upload_size_mb: number;
    }) => {
        try {
            await updateSettings.mutateAsync({
                ...values,
                allowed_file_types: {
                    allowed_prefixes: allowedPrefixes,
                    allowed_types: allowedTypes,
                    blocked_types: blockedTypes,
                },
            });
            message.success('Settings saved successfully');
        } catch {
            message.error('Failed to save settings');
        }
    };

    // Tag input handlers
    const handleAddPrefix = () => {
        const value = inputPrefix.trim();
        if (value && !allowedPrefixes.includes(value)) {
            setAllowedPrefixes([...allowedPrefixes, value]);
        }
        setInputPrefix('');
    };

    const handleAddType = () => {
        const value = inputType.trim();
        if (value && !allowedTypes.includes(value)) {
            setAllowedTypes([...allowedTypes, value]);
        }
        setInputType('');
    };

    const handleAddBlocked = () => {
        const value = inputBlocked.trim();
        if (value && !blockedTypes.includes(value)) {
            setBlockedTypes([...blockedTypes, value]);
        }
        setInputBlocked('');
    };

    const handleRunCleanup = async () => {
        try {
            const result = await runCleanup.mutateAsync();
            message.success(`Cleanup completed: ${result.deleted} files deleted, ${result.failed} failed`);
            refetch();
        } catch {
            message.error('Failed to run cleanup');
        }
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title level={2}>
                <SettingOutlined style={{ marginRight: 8 }} />
                System Settings
            </Title>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <Card title="File Storage Settings" style={{ marginBottom: 24 }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                        >
                            <Divider plain>
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                Orphan File Cleanup
                            </Divider>

                            <Alert
                                message="About Orphan Files"
                                description="When users upload images in the card description editor and later remove them, these files become 'orphaned'. The cleanup job will automatically delete orphan files after the specified number of days."
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />

                            <Form.Item
                                name="orphan_cleanup_enabled"
                                label="Enable Automatic Cleanup"
                                valuePropName="checked"
                            >
                                <Switch
                                    checkedChildren="Enabled"
                                    unCheckedChildren="Disabled"
                                />
                            </Form.Item>

                            <Form.Item
                                name="orphan_cleanup_days"
                                label="Days Before Cleanup"
                                extra="Number of days to wait before deleting orphan files. Minimum: 1, Maximum: 365"
                                rules={[
                                    { required: true, message: 'Please enter cleanup days' },
                                    { type: 'number', min: 1, max: 365, message: 'Must be between 1 and 365 days' },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={365}
                                    style={{ width: 200 }}
                                    addonAfter="days"
                                />
                            </Form.Item>

                            <Form.Item label="Manual Cleanup">
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleRunCleanup}
                                    loading={runCleanup.isPending}
                                >
                                    Run Cleanup Now
                                </Button>
                                <Text type="secondary" style={{ marginLeft: 12 }}>
                                    Delete all orphan files older than {settings?.orphan_cleanup_days || 7} days
                                </Text>
                            </Form.Item>

                            <Divider plain>
                                <CloudUploadOutlined style={{ marginRight: 8 }} />
                                Upload Settings
                            </Divider>

                            <Form.Item
                                name="max_upload_size_mb"
                                label="Maximum Upload Size"
                                extra="Maximum file size allowed for uploads. Minimum: 1 MB, Maximum: 500 MB"
                                rules={[
                                    { required: true, message: 'Please enter max upload size' },
                                    { type: 'number', min: 1, max: 500, message: 'Must be between 1 and 500 MB' },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={500}
                                    style={{ width: 200 }}
                                    addonAfter="MB"
                                />
                            </Form.Item>

                            <Divider plain>
                                <FileOutlined style={{ marginRight: 8 }} />
                                Allowed File Types
                            </Divider>

                            <Alert
                                message="File Type Configuration"
                                description="Configure which file types are allowed for upload. Prefixes match any type starting with that pattern (e.g., 'image/' matches 'image/jpeg', 'image/png', etc.). Blocked types override prefix matches."
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />

                            <Form.Item label="Allowed Prefixes" extra="Match any MIME type starting with these prefixes (e.g., image/, video/, audio/)">
                                <Space wrap style={{ marginBottom: 8 }}>
                                    {allowedPrefixes.map((prefix) => (
                                        <Tag
                                            key={prefix}
                                            closable
                                            color="blue"
                                            onClose={() => setAllowedPrefixes(allowedPrefixes.filter((p) => p !== prefix))}
                                        >
                                            {prefix}
                                        </Tag>
                                    ))}
                                </Space>
                                <Input.Search
                                    placeholder="e.g., image/"
                                    enterButton={<PlusOutlined />}
                                    value={inputPrefix}
                                    onChange={(e) => setInputPrefix(e.target.value)}
                                    onSearch={handleAddPrefix}
                                    style={{ width: 250 }}
                                />
                            </Form.Item>

                            <Form.Item label="Additional Allowed Types" extra="Specific MIME types to allow (e.g., application/pdf)">
                                <Space wrap style={{ marginBottom: 8 }}>
                                    {allowedTypes.map((type) => (
                                        <Tag
                                            key={type}
                                            closable
                                            color="green"
                                            onClose={() => setAllowedTypes(allowedTypes.filter((t) => t !== type))}
                                        >
                                            {type}
                                        </Tag>
                                    ))}
                                </Space>
                                <Input.Search
                                    placeholder="e.g., application/pdf"
                                    enterButton={<PlusOutlined />}
                                    value={inputType}
                                    onChange={(e) => setInputType(e.target.value)}
                                    onSearch={handleAddType}
                                    style={{ width: 300 }}
                                />
                            </Form.Item>

                            <Form.Item label="Blocked Types" extra="Block specific MIME types (overrides prefix matches)">
                                <Space wrap style={{ marginBottom: 8 }}>
                                    {blockedTypes.map((type) => (
                                        <Tag
                                            key={type}
                                            closable
                                            color="red"
                                            onClose={() => setBlockedTypes(blockedTypes.filter((t) => t !== type))}
                                        >
                                            {type}
                                        </Tag>
                                    ))}
                                </Space>
                                <Input.Search
                                    placeholder="e.g., image/svg+xml"
                                    enterButton={<PlusOutlined />}
                                    value={inputBlocked}
                                    onChange={(e) => setInputBlocked(e.target.value)}
                                    onSearch={handleAddBlocked}
                                    style={{ width: 300 }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={updateSettings.isPending}
                                >
                                    Save Settings
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title="System Information">
                        <Descriptions column={1} bordered>
                            <Descriptions.Item
                                label={
                                    <>
                                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                                        Last Cleanup Run
                                    </>
                                }
                            >
                                {settings?.last_orphan_cleanup_at
                                    ? new Date(settings.last_orphan_cleanup_at).toLocaleString()
                                    : <Text type="secondary">Never</Text>
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="Settings Last Updated">
                                {settings?.updated_at
                                    ? new Date(settings.updated_at).toLocaleString()
                                    : <Text type="secondary">Unknown</Text>
                                }
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </>
            )}
        </>
    );
}
