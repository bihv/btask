'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Typography,
    Card,
    Spin,
    Form,
    Button,
    App,
    Alert,
    Tag,
    Input,
    Space,
} from 'antd';
import {
    SafetyOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const { data: settings, isLoading } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const t = useTranslation();

    // File types state
    const [allowedPrefixes, setAllowedPrefixes] = useState<string[]>([]);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [blockedTypes, setBlockedTypes] = useState<string[]>([]);

    // Input states
    const [inputPrefix, setInputPrefix] = useState('');
    const [inputType, setInputType] = useState('');
    const [inputBlocked, setInputBlocked] = useState('');

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (settings) {
            // Initialize file types state
            setAllowedPrefixes(settings.allowed_file_types?.allowed_prefixes || []);
            setAllowedTypes(settings.allowed_file_types?.allowed_types || []);
            setBlockedTypes(settings.allowed_file_types?.blocked_types || []);
        }
    }, [settings]);

    const handleSubmit = async () => {
        try {
            await updateSettings.mutateAsync({
                allowed_file_types: {
                    allowed_prefixes: allowedPrefixes,
                    allowed_types: allowedTypes,
                    blocked_types: blockedTypes,
                },
            });
            message.success(t('UI_SECURITY_SAVED'));
        } catch {
            message.error(t('ERROR_SAVE_SETTINGS'));
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

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title level={2} style={{ marginBottom: 24 }}>
                <SafetyOutlined style={{ marginRight: 8 }} />
                {t('UI_FILE_SECURITY_TITLE')}
            </Title>

            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                {t('UI_FILE_SECURITY_DESC')}
            </Text>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Card title={t('UI_ALLOWED_FILE_TYPES')}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Alert
                            title="File Type Logic"
                            description="Prefixes match any type starting with that pattern (e.g., 'image/'). Blocked types override checking."
                            type="info"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />

                        <Form.Item label={t('UI_ALLOWED_PREFIXES')} extra="Match any MIME type starting with these prefixes (e.g., image/, video/, audio/)">
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                                {allowedPrefixes.length === 0 && <Text type="secondary" style={{ fontSize: 13 }}>No prefixes allowed</Text>}
                                <Space wrap>
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
                            </div>
                            <Input.Search
                                placeholder="Add prefix (e.g., image/)"
                                enterButton={<PlusOutlined />}
                                value={inputPrefix}
                                onChange={(e) => setInputPrefix(e.target.value)}
                                onSearch={handleAddPrefix}
                                style={{ width: 300 }}
                            />
                        </Form.Item>

                        <Form.Item label={t('UI_SPECIFIC_ALLOWED')} extra="Specific MIME types to allow (e.g., application/pdf)">
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 150, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                                {allowedTypes.length === 0 && <Text type="secondary" style={{ fontSize: 13 }}>No specific types allowed</Text>}
                                <Space wrap>
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
                            </div>
                            <Input.Search
                                placeholder="Add MIME type (e.g., application/pdf)"
                                enterButton={<PlusOutlined />}
                                value={inputType}
                                onChange={(e) => setInputType(e.target.value)}
                                onSearch={handleAddType}
                                style={{ width: 350 }}
                            />
                        </Form.Item>

                        <Form.Item label={t('UI_BLOCKED_TYPES')} extra="Block specific MIME types (overrides prefix matches)">
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 120, overflowY: 'auto', background: '#fff1f0' }}>
                                {blockedTypes.length === 0 && <Text type="secondary" style={{ fontSize: 13 }}>No types blocked</Text>}
                                <Space wrap>
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
                            </div>
                            <Input.Search
                                placeholder="Block MIME type (e.g., image/svg+xml)"
                                enterButton={<PlusOutlined />}
                                value={inputBlocked}
                                onChange={(e) => setInputBlocked(e.target.value)}
                                onSearch={handleAddBlocked}
                                style={{ width: 350 }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={updateSettings.isPending}
                            >
                                {t('UI_SAVE_SECURITY_SETTINGS')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </>
    );
}
