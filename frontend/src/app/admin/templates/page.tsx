'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Input, Modal, Form, Typography, Card, Spin, Tag, Space, App, Switch, Select, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useAdminTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, Template, TemplateList as TemplateListType, TemplateCard as TemplateCardType, useUpdateTemplateLists } from '@/hooks/useTemplates';
import TemplateBoardEditor, { TemplateListInput } from '@/components/admin/TemplateBoardEditor';
import BackgroundPicker from '@/components/board/BackgroundPicker';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Title, Text } = Typography;

const CATEGORIES = ['Business', 'Design', 'Education', 'Engineering', 'Marketing', 'Project management', 'Remote work', 'HR & Operations', 'Sales', 'Other'];

export default function AdminTemplatesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message, modal } = App.useApp();
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [templateForm] = Form.useForm();
    const [templateLists, setTemplateLists] = useState<TemplateListInput[]>([]);
    const [fullDescription, setFullDescription] = useState('');
    const [coverColor, setCoverColor] = useState('#0079bf');
    const [coverImage, setCoverImage] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // React Query hooks
    const { data, isLoading } = useAdminTemplates({
        page,
        limit: pageSize,
        search: debouncedSearch,
    });

    const templates = data?.templates || [];
    const total = data?.total || 0;

    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const deleteTemplate = useDeleteTemplate();
    const updateTemplateLists = useUpdateTemplateLists();

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    const handleCreate = async (values: { title: string; author?: string; description?: string; category?: string; is_featured?: boolean }) => {
        try {
            await createTemplate.mutateAsync({
                ...values,
                cover_color: coverColor,
                cover_url: coverImage,
                full_description: fullDescription,
                lists: templateLists.map((list, i) => ({
                    title: list.title,
                    color: list.color,
                    position: i,
                    cards: list.cards.map((card, j) => ({
                        title: card.title,
                        description: card.description,
                        cover_url: card.cover_url,
                        due_date: card.due_date,
                        position: j,
                    })),
                })),
            });
            message.success('Template created');
            setTemplateModalOpen(false);
            templateForm.resetFields();
            setTemplateLists([]);
            setFullDescription('');
            setCoverColor('#0079bf');
            setCoverImage('');
        } catch {
            message.error('Failed to create template');
        }
    };

    const handleUpdate = async (values: { title?: string; author?: string; description?: string; category?: string; is_featured?: boolean; is_active?: boolean }) => {
        if (!editingTemplate) return;
        try {
            await updateTemplate.mutateAsync({ 
                id: editingTemplate.id, 
                data: {
                    ...values,
                    cover_color: coverColor,
                    cover_url: coverImage,
                    full_description: fullDescription,
                } 
            });
            // Update lists if changed
            if (templateLists.length > 0) {
                await updateTemplateLists.mutateAsync({
                    id: editingTemplate.id,
                    lists: templateLists.map((list, i) => ({
                        title: list.title,
                        color: list.color,
                        position: i,
                        cards: list.cards.map((card, j) => ({
                            title: card.title,
                            description: card.description,
                            cover_url: card.cover_url,
                            due_date: card.due_date,
                            position: j,
                        })),
                    })),
                });
            }
            message.success('Template updated');
            setTemplateModalOpen(false);
            setEditingTemplate(null);
            templateForm.resetFields();
            setTemplateLists([]);
            setFullDescription('');
            setCoverColor('#0079bf');
            setCoverImage('');
        } catch {
            message.error('Failed to update template');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTemplate.mutateAsync(id);
            message.success('Template deleted');
        } catch {
            message.error('Failed to delete template');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record: Template) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 32,
                            height: 24,
                            borderRadius: 4,
                            background: record.cover_url 
                                ? `url(${record.cover_url}) center/cover`
                                : record.cover_color || '#0079bf',
                        }}
                    />
                    <span>{title}</span>
                </div>
            ),
        },
        {
            title: 'Author',
            dataIndex: 'author',
            key: 'author',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => <Tag>{cat || 'Other'}</Tag>,
        },
        {
            title: 'Stats',
            key: 'stats',
            render: (_: unknown, record: Template) => (
                <Space>
                    <Tag color="blue">{record.views || 0} views</Tag>
                    <Tag color="green">{record.copies || 0} copies</Tag>
                </Space>
            ),
        },
        {
            title: 'Featured',
            dataIndex: 'is_featured',
            key: 'is_featured',
            render: (featured: boolean) => featured ? <Tag color="gold">Featured</Tag> : null,
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: unknown, record: Template) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/templates/${record.id}`, '_blank')}
                    />
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingTemplate(record);
                            templateForm.setFieldsValue({
                                ...record,
                            });
                            // Set cover states
                            setCoverColor(record.cover_color || '#0079bf');
                            setCoverImage(record.cover_url || '');
                            // Load existing lists
                            if (record.lists) {
                                setTemplateLists(record.lists.map((list: TemplateListType) => ({
                                    id: list.id,
                                    title: list.title,
                                    color: list.color || '',
                                    cards: (list.cards || []).map((card: TemplateCardType) => ({
                                        id: card.id,
                                        title: card.title,
                                        description: card.description,
                                        cover_url: card.cover_url,
                                        due_date: card.due_date,
                                    })),
                                })));
                            } else {
                                setTemplateLists([]);
                            }
                            // Load existing full_description
                            setFullDescription(record.full_description || '');
                            setTemplateModalOpen(true);
                        }}
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            modal.confirm({
                                title: 'Delete this template?',
                                content: 'This action cannot be undone.',
                                okText: 'Delete',
                                okType: 'danger',
                                onOk: () => handleDelete(record.id),
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
                <Title level={2} style={{ margin: 0 }}>Templates</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingTemplate(null);
                        templateForm.resetFields();
                        setTemplateLists([]);
                        setFullDescription('');
                        setCoverColor('#0079bf');
                        setCoverImage('');
                        setTemplateModalOpen(true);
                    }}
                >
                    Add Template
                </Button>
            </div>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Search templates..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Text type="secondary">
                        Showing {templates.length} of {total} templates
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
                        dataSource={templates}
                        columns={columns}
                        rowKey="id"
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`,
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
                title={editingTemplate ? 'Edit Template' : 'Create Template'}
                open={templateModalOpen}
                onCancel={() => {
                    setTemplateModalOpen(false);
                    setEditingTemplate(null);
                    templateForm.resetFields();
                    setTemplateLists([]);
                    setFullDescription('');
                    setCoverColor('#0079bf');
                    setCoverImage('');
                }}
                footer={null}
                width={900}
            >
                <Form
                    form={templateForm}
                    layout="vertical"
                    onFinish={editingTemplate ? handleUpdate : handleCreate}
                >
                    <Tabs
                        defaultActiveKey="basic"
                        items={[
                            {
                                key: 'basic',
                                label: 'Basic Info',
                                children: (
                                    <>
                                        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                                            <Input placeholder="Template title" />
                                        </Form.Item>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <Form.Item name="author" label="Author" style={{ flex: 1 }}>
                                                <Input placeholder="Author name" />
                                            </Form.Item>
                                            <Form.Item name="category" label="Category" style={{ flex: 1 }}>
                                                <Select placeholder="Select category">
                                                    {CATEGORIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                                                </Select>
                                            </Form.Item>
                                        </div>
                                        <Form.Item name="description" label="Description">
                                            <Input.TextArea placeholder="Short description" rows={2} />
                                        </Form.Item>
                                        <div style={{ marginBottom: 16 }}>
                                            <Text style={{ marginBottom: 8, display: 'block' }}>Full Description</Text>
                                            <RichTextEditor
                                                content={fullDescription}
                                                onChange={setFullDescription}
                                                editable={true}
                                                placeholder="Write detailed description..."
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                                            <Form.Item name="is_featured" label="Featured" valuePropName="checked">
                                                <Switch />
                                            </Form.Item>
                                            {editingTemplate && (
                                                <Form.Item name="is_active" label="Active" valuePropName="checked">
                                                    <Switch />
                                                </Form.Item>
                                            )}
                                        </div>
                                    </>
                                ),
                            },
                            {
                                key: 'cover',
                                label: 'Cover',
                                children: (
                                    <div>
                                        <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                                            Choose a cover color or image for your template:
                                        </Text>
                                        <BackgroundPicker
                                            value={coverColor}
                                            imageValue={coverImage}
                                            onChange={setCoverColor}
                                            onImageChange={setCoverImage}
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: 'board',
                                label: 'Board Structure',
                                children: (
                                    <div>
                                        <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                                            Add lists and cards that will be created when using this template:
                                        </Text>
                                        <TemplateBoardEditor lists={templateLists} onChange={setTemplateLists} />
                                    </div>
                                ),
                            },
                        ]}
                    />
                    <div style={{ marginTop: 16 }}>
                        <Button type="primary" htmlType="submit" block loading={createTemplate.isPending || updateTemplate.isPending}>
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}
