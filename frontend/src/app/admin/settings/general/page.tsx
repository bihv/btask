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
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

export default function GeneralSettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const { data: settings, isLoading, refetch } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const runCleanup = useRunCleanup();
    const t = useTranslation();

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
            message.success(t('UI_SETTINGS_SAVED'));
        } catch {
            message.error(t('ERROR_SAVE_SETTINGS'));
        }
    };

    const handleRunCleanup = async () => {
        try {
            const result = await runCleanup.mutateAsync();
            message.success(`Cleanup completed: ${result.deleted} files deleted, ${result.failed} failed`);
            refetch();
        } catch {
            message.error(t('ERROR_RUN_CLEANUP'));
        }
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title level={2} style={{ marginBottom: 24 }}>
                <SettingOutlined style={{ marginRight: 8 }} />
                {t('UI_GENERAL_SETTINGS')}
            </Title>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Card title={t('UI_FILE_STORAGE_SETTINGS')}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                        >
                            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                {t('UI_ORPHAN_FILE_CLEANUP')}
                            </Title>

                            <Alert
                                description="When users upload images and later remove them, these files become 'orphaned'."
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />

                            <Form.Item
                                name="orphan_cleanup_enabled"
                                label={t('UI_ENABLE_AUTO_CLEANUP')}
                                valuePropName="checked"
                            >
                                <Switch
                                    checkedChildren={t('UI_ENABLED')}
                                    unCheckedChildren={t('UI_DISABLED')}
                                />
                            </Form.Item>

                            <Form.Item
                                label={t('UI_DAYS_BEFORE_CLEANUP')}
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

                            <Form.Item label={t('UI_MANUAL_CLEANUP')}>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleRunCleanup}
                                    loading={runCleanup.isPending}
                                >
                                    {t('UI_RUN_CLEANUP_NOW')}
                                </Button>
                                <Text type="secondary" style={{ marginLeft: 12 }}>
                                    Delete files older than {settings?.orphan_cleanup_days || 7} days
                                </Text>
                            </Form.Item>

                            <Divider style={{ margin: '24px 0' }} />

                            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                                <CloudUploadOutlined style={{ marginRight: 8 }} />
                                {t('UI_UPLOAD_CONFIGURATION')}
                            </Title>

                            <Form.Item
                                label={t('UI_MAX_UPLOAD_SIZE')}
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
                                    {t('UI_SAVE_CHANGES')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title={t('UI_SYSTEM_INFORMATION')}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item
                                label={
                                    <>
                                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                                        {t('UI_LAST_CLEANUP_RUN')}
                                    </>
                                }
                            >
                                {settings?.last_orphan_cleanup_at
                                    ? new Date(settings.last_orphan_cleanup_at).toLocaleString()
                                    : <Text type="secondary">{t('UI_NEVER')}</Text>
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label={t('UI_SETTINGS_LAST_UPDATED')}>
                                {settings?.updated_at
                                    ? new Date(settings.updated_at).toLocaleString()
                                    : <Text type="secondary">{t('UI_NEVER')}</Text>
                                }
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Space>
            )}
        </>
    );
}
