'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Input, Select, Modal, Form, Typography, Card, Spin, Tag, Space, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import {
    useAdminLabels,
    useCreateLabel,
    useUpdateLabel,
    useDeleteLabel,
    useCreateTranslation,
    useUpdateTranslation,
    useDeleteTranslation,
    SystemLabel,
} from '@/hooks/useAdmin';

const { Title, Text } = Typography;

const LANGUAGES = ['vi-VN'];

// Convert locale code (e.g., 'vi-VN') to flag emoji
const getFlag = (locale: string): string => {
    const country = locale.split('-')[1] || locale;
    return country
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
        .join('');
};

const CATEGORIES = ['error', 'ui', 'notification', 'email', 'other'];

export default function AdminLabelsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message, modal } = App.useApp();
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<SystemLabel | null>(null);
    const [labelForm] = Form.useForm();

    // Server-side pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

    // Debounced search for server-side filtering
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
            setPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // React Query hooks with server-side params
    const { data, isLoading } = useAdminLabels({
        page,
        limit: pageSize,
        search: debouncedSearch,
        category: categoryFilter,
    });

    const labels = data?.labels || [];
    const total = data?.total || 0;

    const createLabel = useCreateLabel();
    const updateLabel = useUpdateLabel();
    const deleteLabel = useDeleteLabel();
    const createTranslation = useCreateTranslation();
    const updateTranslation = useUpdateTranslation();
    const deleteTranslation = useDeleteTranslation();

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    const handleCreateLabel = async (values: { key: string; category: string; default_value: string; description: string }) => {
        try {
            await createLabel.mutateAsync(values);
            message.success('Label created');
            setLabelModalOpen(false);
            labelForm.resetFields();
        } catch {
            message.error('Failed to create label');
        }
    };

    const handleUpdateLabel = async (values: { key: string; category: string; default_value: string; description: string }) => {
        if (!editingLabel) return;
        try {
            await updateLabel.mutateAsync({ id: editingLabel.id, data: values });
            message.success('Label updated');
            setLabelModalOpen(false);
            setEditingLabel(null);
            labelForm.resetFields();
        } catch {
            message.error('Failed to update label');
        }
    };

    const handleDeleteLabel = async (id: string) => {
        try {
            await deleteLabel.mutateAsync(id);
            message.success('Label deleted');
        } catch {
            message.error('Failed to delete label');
        }
    };

    const handleSaveTranslation = async (labelId: string, language: string, value: string, existingId?: string) => {
        try {
            if (existingId) {
                await updateTranslation.mutateAsync({ id: existingId, value });
            } else {
                await createTranslation.mutateAsync({ label_id: labelId, language, value });
            }
            message.success('Translation saved');
        } catch {
            message.error('Failed to save translation');
        }
    };

    const handleDeleteTranslation = async (id: string) => {
        try {
            await deleteTranslation.mutateAsync(id);
            message.success('Translation deleted');
        } catch {
            message.error('Failed to delete translation');
        }
    };

    const columns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            width: 200,
        },
        {
            title: 'Default (EN)',
            dataIndex: 'default_value',
            key: 'default_value',
            ellipsis: true,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (cat: string) => <Tag>{cat || 'other'}</Tag>,
        },
        {
            title: 'Translations',
            key: 'translations',
            width: 120,
            render: (_: unknown, record: SystemLabel) => {
                const count = record.translations?.length || 0;
                return <Tag color={count > 0 ? 'green' : 'default'}>{count}/{LANGUAGES.length}</Tag>;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: SystemLabel) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingLabel(record);
                            labelForm.setFieldsValue(record);
                            setLabelModalOpen(true);
                        }}
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            modal.confirm({
                                title: 'Delete this label?',
                                content: 'All translations will be deleted.',
                                okText: 'Delete',
                                okType: 'danger',
                                onOk: () => handleDeleteLabel(record.id),
                            });
                        }}
                    />
                </Space>
            ),
        },
    ];

    const expandedRowRender = (record: SystemLabel) => {
        const translationMap = new Map(record.translations?.map(t => [t.language, t]) || []);

        return (
            <div style={{ padding: '8px 0' }}>
                {LANGUAGES.map(locale => {
                    const langCode = locale.split('-')[0];
                    const translation = translationMap.get(langCode) || translationMap.get(locale);
                    return (
                        <TranslationRow
                            key={locale}
                            language={locale}
                            value={translation?.value || ''}
                            translationId={translation?.id}
                            labelId={record.id}
                            onSave={handleSaveTranslation}
                            onDelete={handleDeleteTranslation}
                            confirmDelete={modal.confirm}
                        />
                    );
                })}
            </div>
        );
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>System Labels</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingLabel(null);
                        labelForm.resetFields();
                        setLabelModalOpen(true);
                    }}
                >
                    Add Label
                </Button>
            </div>

            {/* Filter Section */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Search by key or value..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by category"
                        value={categoryFilter}
                        onChange={(val) => {
                            setCategoryFilter(val);
                            setPage(1); // Reset to first page on category change
                        }}
                        style={{ width: 180 }}
                        allowClear
                    >
                        {CATEGORIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                    </Select>
                    <Text type="secondary">
                        Showing {labels.length} of {total} labels
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
                        dataSource={labels}
                        columns={columns}
                        rowKey="id"
                        expandable={{ expandedRowRender }}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} labels`,
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
                title={editingLabel ? 'Edit Label' : 'Create Label'}
                open={labelModalOpen}
                onCancel={() => {
                    setLabelModalOpen(false);
                    setEditingLabel(null);
                    labelForm.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={labelForm}
                    layout="vertical"
                    onFinish={editingLabel ? handleUpdateLabel : handleCreateLabel}
                >
                    <Form.Item name="key" label="Key" rules={[{ required: true }]}>
                        <Input placeholder="ERROR_EMAIL_IN_USE" />
                    </Form.Item>
                    <Form.Item name="category" label="Category">
                        <Select placeholder="Select category">
                            {CATEGORIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="default_value" label="Default Value (EN)" rules={[{ required: true }]}>
                        <Input.TextArea placeholder="English text" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Description for admin" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={createLabel.isPending || updateLabel.isPending}>
                            {editingLabel ? 'Update' : 'Create'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

// Translation row component
function TranslationRow({
    language,
    value,
    translationId,
    labelId,
    onSave,
    onDelete,
    confirmDelete,
}: {
    language: string;
    value: string;
    translationId?: string;
    labelId: string;
    onSave: (labelId: string, language: string, value: string, existingId?: string) => void;
    onDelete: (id: string) => void;
    confirmDelete: (config: { title: string; okText: string; okType: 'danger'; onOk: () => void }) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    const handleSave = () => {
        if (inputValue.trim()) {
            onSave(labelId, language, inputValue, translationId);
            setEditing(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Tag style={{ minWidth: 60, textAlign: 'center' }}>
                {getFlag(language)} {language.split('-')[0]}
            </Tag>
            {editing ? (
                <>
                    <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        style={{ flex: 1 }}
                        onPressEnter={handleSave}
                    />
                    <Button size="small" type="primary" onClick={handleSave}>Save</Button>
                    <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
                </>
            ) : (
                <>
                    <Text style={{ flex: 1, color: value ? undefined : '#999' }}>
                        {value || '(not translated)'}
                    </Text>
                    <Button
                        size="small"
                        icon={value ? <EditOutlined /> : <PlusOutlined />}
                        onClick={() => { setInputValue(value); setEditing(true); }}
                    />
                    {translationId && (
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                confirmDelete({
                                    title: 'Delete translation?',
                                    okText: 'Delete',
                                    okType: 'danger',
                                    onOk: () => onDelete(translationId),
                                });
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
}
