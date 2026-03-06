'use client';

import TemplateBoardEditor, { TemplateListInput } from '@/components/admin/TemplateBoardEditor';
import BackgroundPicker from '@/components/board/BackgroundPicker';
import { useTranslation } from '@/hooks/useLabels';
import { useAdminTemplates, useCreateTemplate, useDeleteTemplate, useUpdateTemplate, useUpdateTemplateLists } from '@/hooks/useTemplates';
import { useAuthStore } from '@/stores/authStore';
import { Template, TemplateCard as TemplateCardType, TemplateList as TemplateListType } from '@/types';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge, Button, Card, Group, Loader, Modal, Select, Switch, Tabs, Text, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconEye, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

const CATEGORIES = ['Business', 'Design', 'Education', 'Engineering', 'Marketing', 'Project management', 'Remote work', 'HR & Operations', 'Sales', 'Other'];

export default function AdminTemplatesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const t = useTranslation();
    // Form state
    const form = useForm({
        initialValues: {
            title: '',
            author: '',
            description: '',
            category: null as string | null,
            is_featured: false,
            is_active: true,
            cover_color: '#206A5D',
            cover_url: '',
            full_description: '',
            lists: [] as TemplateListInput[],
        }
    });

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
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

    const resetForm = () => {
        form.reset();
    };

    const handleCreate = async (values: typeof form.values) => {
        try {
            await createTemplate.mutateAsync({
                title: values.title,
                author: values.author,
                description: values.description,
                category: values.category || undefined,
                is_featured: values.is_featured,
                cover_color: values.cover_color,
                cover_url: values.cover_url,
                full_description: values.full_description,
                lists: values.lists.map((list, i) => ({
                    title: list.title,
                    color: list.color,
                    position: i,
                    cards: list.cards.map((card, j) => ({
                        title: card.title,
                        description: card.description,
                        cover_url: card.cover_url,
                        due_date: card.due_date,
                        position: j,
                        link_url: card.link_url,
                        link_title: card.link_title,
                        link_description: card.link_description,
                        link_image: card.link_image,
                        link_site_name: card.link_site_name,
                        link_favicon: card.link_favicon,
                    })),
                })),
            });
            notifications.show({ message: 'Template created', color: 'green' });
            setTemplateModalOpen(false);
            resetForm();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to create template', color: 'red' });
        }
    };

    const handleUpdate = async (values: typeof form.values) => {
        if (!editingTemplate) return;
        try {
            await updateTemplate.mutateAsync({
                id: editingTemplate.id,
                data: {
                    title: values.title,
                    author: values.author,
                    description: values.description,
                    category: values.category || undefined,
                    is_featured: values.is_featured,
                    is_active: values.is_active,
                    cover_color: values.cover_color,
                    cover_url: values.cover_url,
                    full_description: values.full_description,
                }
            });
            // Update lists if changed
            if (values.lists.length > 0) {
                await updateTemplateLists.mutateAsync({
                    id: editingTemplate.id,
                    lists: values.lists.map((list, i) => ({
                        title: list.title,
                        color: list.color,
                        position: i,
                        cards: list.cards.map((card, j) => ({
                            title: card.title,
                            description: card.description,
                            cover_url: card.cover_url,
                            due_date: card.due_date,
                            position: j,
                            link_url: card.link_url,
                            link_title: card.link_title,
                            link_description: card.link_description,
                            link_image: card.link_image,
                            link_site_name: card.link_site_name,
                            link_favicon: card.link_favicon,
                        })),
                    })),
                });
            }
            notifications.show({ message: 'Template updated', color: 'green' });
            setTemplateModalOpen(false);
            setEditingTemplate(null);
            resetForm();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to update template', color: 'red' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTemplate.mutateAsync(id);
            notifications.show({ message: 'Template deleted', color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to delete template', color: 'red' });
        }
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title order={2} style={{ margin: 0 }}>{t('UI_TEMPLATES')}</Title>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                        setEditingTemplate(null);
                        resetForm();
                        setTemplateModalOpen(true);
                    }}
                >
                    {t('UI_ADD_TEMPLATE')}
                </Button>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Group wrap="wrap">
                    <TextInput
                        placeholder={t('UI_SEARCH_TEMPLATES')}
                        leftSection={<IconSearch size={16} />}
                        value={searchText}
                        onChange={e => setSearchText(e.currentTarget.value)}
                        style={{ width: 300 }}
                    />
                    <Text c="dimmed">
                        Showing {templates.length} of {total} templates
                    </Text>
                </Group>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_TITLE')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_AUTHOR')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_CATEGORY')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_STATS')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_FEATURED')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Active</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)', width: 150 }}>{t('UI_ACTIONS')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((record: Template) => (
                                    <tr key={record.id}>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 24,
                                                        borderRadius: 4,
                                                        background: record.cover_url
                                                            ? `url(${record.cover_url}) center/cover`
                                                            : record.cover_color || '#206A5D',
                                                    }}
                                                />
                                                <span>{record.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{record.author}</td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Badge>{record.category || 'Other'}</Badge>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Group>
                                                <Badge color="blue">{record.views || 0} views</Badge>
                                                <Badge color="green">{record.copies || 0} copies</Badge>
                                            </Group>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            {record.is_featured ? <Badge color="yellow">{t('UI_FEATURED')}</Badge> : null}
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Badge color={record.is_active ? 'green' : 'gray'}>{record.is_active ? t('UI_ACTIVE') : t('UI_INACTIVE')}</Badge>
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Group>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconEye size={16} />}
                                                    onClick={() => window.open(`/templates/${record.id}`, '_blank')}
                                                />
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconEdit size={16} />}
                                                    onClick={() => {
                                                        setEditingTemplate(record);
                                                        form.setValues({
                                                            title: record.title || '',
                                                            author: record.author || '',
                                                            description: record.description || '',
                                                            category: record.category || null,
                                                            is_featured: record.is_featured || false,
                                                            is_active: record.is_active !== false,
                                                            cover_color: record.cover_color || '#206A5D',
                                                            cover_url: record.cover_url || '',
                                                            full_description: record.full_description || '',
                                                            lists: record.lists ? record.lists.map((list: TemplateListType) => ({
                                                                id: list.id,
                                                                title: list.title,
                                                                color: list.color || '',
                                                                cards: (list.cards || []).map((card: TemplateCardType) => ({
                                                                    ...card,
                                                                })),
                                                            })) : [],
                                                        });
                                                        setTemplateModalOpen(true);
                                                    }}
                                                />
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="red"
                                                    leftSection={<IconTrash size={16} />}
                                                    onClick={() => handleDelete(record.id)}
                                                />
                                            </Group>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {total > pageSize && (
                            <Group justify="center" mt="md">
                                <Button variant="subtle" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <Text size="sm">Page {page} of {Math.ceil(total / pageSize)}</Text>
                                <Button variant="subtle" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </Group>
                        )}
                    </div>
                )}
            </Card>

            <Modal
                title={editingTemplate ? t('UI_EDIT_TEMPLATE') : t('UI_CREATE_TEMPLATE')}
                opened={templateModalOpen}
                onClose={() => {
                    setTemplateModalOpen(false);
                    setEditingTemplate(null);
                    resetForm();
                }}
                size="xl"
            >
                <form onSubmit={form.onSubmit((values) => editingTemplate ? handleUpdate(values) : handleCreate(values))}>
                    <Tabs defaultValue="basic">
                        <Tabs.List>
                            <Tabs.Tab value="basic">{t('UI_BASIC_INFO')}</Tabs.Tab>
                            <Tabs.Tab value="cover">{t('UI_COVER')}</Tabs.Tab>
                            <Tabs.Tab value="board">{t('UI_BOARD_STRUCTURE')}</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="basic" pt="md">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <TextInput
                                    label="Title"
                                    placeholder="Template title"
                                    {...form.getInputProps('title')}
                                    required
                                />
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <TextInput
                                        label="Author"
                                        placeholder="Author name"
                                        {...form.getInputProps('author')}
                                        style={{ flex: 1 }}
                                    />
                                    <Select
                                        label="Category"
                                        placeholder={t('UI_SELECT_CATEGORY')}
                                        data={CATEGORIES}
                                        {...form.getInputProps('category')}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                                <Textarea
                                    label="Description"
                                    placeholder="Short description"
                                    rows={2}
                                    {...form.getInputProps('description')}
                                />
                                <div style={{ marginBottom: 16 }}>
                                    <Text style={{ marginBottom: 8, display: 'block' }}>{t('UI_FULL_DESCRIPTION')}</Text>
                                    <RichTextEditor
                                        content={form.values.full_description}
                                        onChange={(html) => form.setFieldValue('full_description', html)}
                                        editable={true}
                                        placeholder="Write detailed description..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                                    <Switch
                                        label={t('UI_FEATURED')}
                                        {...form.getInputProps('is_featured', { type: 'checkbox' })}
                                    />
                                    {editingTemplate && (
                                        <Switch
                                            label={t('UI_ACTIVE')}
                                            {...form.getInputProps('is_active', { type: 'checkbox' })}
                                        />
                                    )}
                                </div>
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel value="cover" pt="md">
                            <div>
                                <Text c="dimmed" style={{ marginBottom: 12, display: 'block' }}>
                                    {t('UI_CHOOSE_COVER')}
                                </Text>
                                <BackgroundPicker
                                    value={form.values.cover_color}
                                    imageValue={form.values.cover_url}
                                    onChange={(color) => {
                                        form.setFieldValue('cover_color', color);
                                        form.setFieldValue('cover_url', '');
                                    }}
                                    onImageChange={(url) => {
                                        form.setFieldValue('cover_url', url);
                                        form.setFieldValue('cover_color', '');
                                    }}
                                />
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel value="board" pt="md">
                            <div>
                                <Text c="dimmed" style={{ marginBottom: 12, display: 'block' }}>
                                    {t('UI_ADD_LISTS_CARDS')}
                                </Text>
                                <TemplateBoardEditor lists={form.values.lists} onChange={(lists) => form.setFieldValue('lists', lists)} />
                            </div>
                        </Tabs.Panel>
                    </Tabs>
                    <div style={{ marginTop: 16 }}>
                        <Button type="submit" fullWidth loading={createTemplate.isPending || updateTemplate.isPending}>
                            {editingTemplate ? t('UI_UPDATE_TEMPLATE') : t('UI_CREATE_TEMPLATE')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
