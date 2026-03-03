'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button, TextInput, Select, Modal, Text, Title, Card, Loader, Badge, Group, Textarea, Pagination } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconDownload, IconUpload } from '@tabler/icons-react';
import {
    useAdminLabels,
    useUpdateLabel,
    useCreateTranslation,
    useUpdateTranslation,
    useDeleteTranslation,
    exportLabels,
    useImportLabels,
    SystemLabel,
} from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';

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
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<SystemLabel | null>(null);
    const t = useTranslation();

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

    const updateLabel = useUpdateLabel();
    const createTranslation = useCreateTranslation();
    const updateTranslation = useUpdateTranslation();
    const deleteTranslation = useDeleteTranslation();
    const importLabels = useImportLabels();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    // Form state
    const form = useForm({
        initialValues: {
            key: '',
            category: '',
            default_value: '',
            description: '',
        }
    });

    useEffect(() => {
        if (editingLabel) {
            form.setValues({
                key: editingLabel.key,
                category: editingLabel.category || '',
                default_value: editingLabel.default_value,
                description: editingLabel.description || '',
            });
        }
    }, [editingLabel]);

    const handleUpdateLabel = async (values: typeof form.values) => {
        if (!editingLabel) return;
        try {
            await updateLabel.mutateAsync({ id: editingLabel.id, data: values });
            notifications.show({ message: 'Label updated', color: 'green' });
            setLabelModalOpen(false);
            setEditingLabel(null);
            form.reset();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to update label', color: 'red' });
        }
    };

    const handleSaveTranslation = async (labelId: string, language: string, value: string, existingId?: string) => {
        try {
            if (existingId) {
                await updateTranslation.mutateAsync({ id: existingId, value });
            } else {
                await createTranslation.mutateAsync({ label_id: labelId, language, value });
            }
            notifications.show({ message: 'Translation saved', color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to save translation', color: 'red' });
        }
    };

    const handleDeleteTranslation = async (id: string) => {
        try {
            await deleteTranslation.mutateAsync(id);
            notifications.show({ message: 'Translation deleted', color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to delete translation', color: 'red' });
        }
    };

    const handleExport = async () => {
        try {
            await exportLabels();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to export labels', color: 'red' });
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await importLabels.mutateAsync(file);
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to import labels', color: 'red' });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const columns = [
        {
            title: t('UI_KEY'),
            dataIndex: 'key',
            key: 'key',
            width: 200,
        },
        {
            title: t('UI_DEFAULT_EN'),
            dataIndex: 'default_value',
            key: 'default_value',
            ellipsis: true,
        },
        {
            title: t('UI_CATEGORY'),
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (cat: string) => <Badge>{cat || 'other'}</Badge>,
        },
        {
            title: t('UI_TRANSLATIONS'),
            key: 'translations',
            width: 120,
            render: (_: unknown, record: SystemLabel) => {
                const count = record.translations?.length || 0;
                return <Badge color={count > 0 ? 'green' : 'gray'}>{count}/{LANGUAGES.length}</Badge>;
            },
        },
        {
            title: t('UI_ACTIONS'),
            key: 'actions',
            width: 100,
            render: (_: unknown, record: SystemLabel) => (
                <Group>
                    <Button
                        size="sm"
                        leftSection={<IconEdit size={16} />}
                        onClick={() => {
                            setEditingLabel(record);
                            setLabelModalOpen(true);
                        }}
                    />
                </Group>
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
                <Title order={4} style={{ margin: 0 }}>System Labels</Title>
                <Group>
                    <Button leftSection={<IconDownload size={16} />} onClick={handleExport}>Export</Button>
                    <Button leftSection={<IconUpload size={16} />} onClick={() => fileInputRef.current?.click()}>Import</Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImport}
                    />
                </Group>
            </div>

            {/* Filter Section */}
            <Card style={{ marginBottom: 16 }}>
                <Group wrap="wrap">
                    <TextInput
                        placeholder={t('UI_SEARCH_KEY_VALUE')}
                        leftSection={<IconSearch size={16} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}

                    />
                    <Select
                        placeholder={t('UI_FILTER_BY_CATEGORY')}
                        value={categoryFilter}
                        onChange={(val) => {
                            setCategoryFilter(val || undefined);
                            setPage(1); // Reset to first page on category change
                        }}
                        style={{ width: 180 }}

                        data={CATEGORIES} />
                    <Text c="dimmed">
                        Showing {labels.length} of {total} labels
                    </Text>
                </Group>
            </Card>

            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', width: 200 }}>{t('UI_KEY')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('UI_DEFAULT_EN')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left', width: 120 }}>{t('UI_CATEGORY')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left', width: 120 }}>{t('UI_TRANSLATIONS')}</th>
                                        <th style={{ padding: '8px', textAlign: 'left', width: 100 }}>{t('UI_ACTIONS')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labels.map((record: SystemLabel) => (
                                        <React.Fragment key={record.id}>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.key}</td>
                                                <td style={{ padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.default_value}</td>
                                                <td style={{ padding: '8px' }}><Badge>{record.category || 'other'}</Badge></td>
                                                <td style={{ padding: '8px' }}>
                                                    <Badge color={(record.translations?.length || 0) > 0 ? 'green' : 'gray'}>
                                                        {record.translations?.length || 0}/{LANGUAGES.length}
                                                    </Badge>
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <Button
                                                        size="sm"
                                                        leftSection={<IconEdit size={16} />}
                                                        onClick={() => {
                                                            setEditingLabel(record);
                                                            setLabelModalOpen(true);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={5} style={{ padding: '0 8px 8px 8px' }}>
                                                    {expandedRowRender(record)}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {total > pageSize && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    total={Math.ceil(total / pageSize)}
                                    value={page}
                                    onChange={(newPage: number) => setPage(newPage)}
                                />
                            </Group>
                        )}
                    </>
                )}
            </Card>

            <Modal
                title={t('UI_EDIT_LABEL')}
                opened={labelModalOpen}
                onClose={() => {
                    setLabelModalOpen(false);
                    setEditingLabel(null);
                    form.reset();
                }}
            >
                <form onSubmit={form.onSubmit(handleUpdateLabel)}>
                    <div>
                        <TextInput placeholder="ERROR_EMAIL_IN_USE" disabled {...form.getInputProps('key')} />
                    </div>
                    <div>
                        <Select placeholder="Select category" disabled data={CATEGORIES} {...form.getInputProps('category')} />
                    </div>
                    <div>
                        <Textarea placeholder="English text" {...form.getInputProps('default_value')} />
                    </div>
                    <div>
                        <Textarea placeholder="Description for admin" {...form.getInputProps('description')} />
                    </div>
                    <div>
                        <Button type="submit" fullWidth loading={updateLabel.isPending}>
                            {t('UI_UPDATE')}
                        </Button>
                    </div>
                </form>
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
}: {
    language: string;
    value: string;
    translationId?: string;
    labelId: string;
    onSave: (labelId: string, language: string, value: string, existingId?: string) => void;
    onDelete: (id: string) => void;
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
            <Badge style={{ minWidth: 60, textAlign: 'center' }}>
                {getFlag(language)} {language.split('-')[0]}
            </Badge>
            {editing ? (
                <>
                    <TextInput
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        style={{ flex: 1 }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    />
                    <Button variant="subtle" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}>Save</Button>
                </>
            ) : (
                <>
                    <Text style={{ flex: 1, color: value ? undefined : '#999' }}>
                        {value || '(not translated)'}
                    </Text>
                    <Button
                        size="sm"
                        leftSection={value ? <IconEdit size={16} /> : <IconPlus size={16} />}
                        onClick={() => { setInputValue(value); setEditing(true); }}
                    />

                </>
            )}
        </div>
    );
}
