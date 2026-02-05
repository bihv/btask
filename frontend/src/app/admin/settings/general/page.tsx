'use client';

import { useEffect } from 'react';
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
    Input,
    Space,
} from 'antd';
import {
    SettingOutlined,
    ClockCircleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings, useUpdateSystemSettings, useRunCleanup } from '@/hooks/useAdmin';

const { Title, Text } = Typography;

export default function GeneralSettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const { data: settings, isLoading, refetch } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const runCleanup = useRunCleanup();

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
        }
    }, [settings, form]);

    const handleSubmit = async (values: {
        orphan_cleanup_days: number;
        orphan_cleanup_enabled: boolean;
        max_upload_size_mb: number;
    }) => {
        try {
            await updateSettings.mutateAsync(values);
            message.success('Settings saved successfully');
        } catch {
            message.error('Failed to save settings');
        }
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
            <Title level={2} style={{ marginBottom: 24 }}>
                <SettingOutlined style={{ marginRight: 8 }} />
                General Settings
            </Title>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Card title="File Storage Settings">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                        >
                            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                Orphan File Cleanup
                            </Title>

                            <Alert
                                description="When users upload images and later remove them, these files become 'orphaned'."
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
                                label="Days Before Cleanup"
                                extra="Number of days to wait before deleting orphan files."
                                required
                            >
                                <Space.Compact>
                                    <Form.Item
                                        name="orphan_cleanup_days"
                                        noStyle
                                        rules={[
                                            { required: true, message: 'Please enter cleanup days' },
                                            { type: 'number', min: 1, max: 365, message: 'Must be between 1 and 365 days' },
                                        ]}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={365}
                                            style={{ width: 155 }}
                                        />
                                    </Form.Item>
                                    <Input
                                        style={{ width: 50, textAlign: 'center', pointerEvents: 'none' }}
                                        value="days"
                                        readOnly
                                    />
                                </Space.Compact>
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
                                    Delete files older than {settings?.orphan_cleanup_days || 7} days
                                </Text>
                            </Form.Item>

                            <Divider style={{ margin: '24px 0' }} />

                            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                                <CloudUploadOutlined style={{ marginRight: 8 }} />
                                Upload Configuration
                            </Title>

                            <Form.Item
                                label="Maximum Upload Size"
                                extra="Maximum file size allowed (1-500 MB)"
                                required
                            >
                                <Space.Compact>
                                    <Form.Item
                                        name="max_upload_size_mb"
                                        noStyle
                                        rules={[
                                            { required: true, message: 'Please enter max upload size' },
                                            { type: 'number', min: 1, max: 500, message: 'Must be between 1 and 500 MB' },
                                        ]}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={500}
                                            style={{ width: 160 }}
                                        />
                                    </Form.Item>
                                    <Input
                                        style={{ width: 50, textAlign: 'center', pointerEvents: 'none' }}
                                        value="MB"
                                        readOnly
                                    />
                                </Space.Compact>
                            </Form.Item>

                            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={updateSettings.isPending}
                                >
                                    Save Changes
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title="System Information">
                        <Descriptions column={1} bordered size="small">
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
                </Space>
            )}
        </>
    );
}
