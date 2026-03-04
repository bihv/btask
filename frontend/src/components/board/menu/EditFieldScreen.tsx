'use client';

import { useTranslation } from '@/hooks/useLabels';
import { customFieldApi } from '@/lib/api';
import { CustomField, CustomFieldOption } from '@/types';
import { useState } from 'react';
import { ScreenHeader } from './MenuShared';

import { Button, Checkbox, Divider, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
interface EditFieldScreenProps {
    field: CustomField;
    onBack: () => void;
    onUpdate: (field: CustomField) => void;
    onDelete: () => void;
}

export default function EditFieldScreen({ field, onBack, onUpdate, onDelete }: EditFieldScreenProps) {
    const t = useTranslation();
    const [name, setName] = useState(field.name);
    const [showOnCard, setShowOnCard] = useState(field.show_on_card);
    const [options, setOptions] = useState<CustomFieldOption[]>(field.options || []);
    const [newOption, setNewOption] = useState('');
    const [saving, setSaving] = useState(false);
    const [addingOption, setAddingOption] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            notifications.show({ title: 'Error', message: t('ERROR_FIELD_NAME_REQUIRED'), color: 'red' });
            return;
        }

        setSaving(true);
        try {
            const response = await customFieldApi.update(field.id, {
                name: name.trim(),
                show_on_card: showOnCard,
            });
            onUpdate(response.data.data);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_UPDATE_FIELD_FAILED'), color: 'red' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddOption = async () => {
        if (!newOption.trim()) return;

        setAddingOption(true);
        try {
            const response = await customFieldApi.addOption(field.id, {
                value: newOption.trim(),
            });
            setOptions([...options, response.data.data]);
            setNewOption('');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_ADD_OPTION_FAILED'), color: 'red' });
        } finally {
            setAddingOption(false);
        }
    };

    const handleDeleteOption = async (optionId: string) => {
        try {
            await customFieldApi.deleteOption(optionId);
            setOptions(options.filter(o => o.id !== optionId));
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_DELETE_OPTION_FAILED'), color: 'red' });
        }
    };

    const handleDelete = async () => {
        try {
            await customFieldApi.delete(field.id);
            notifications.show({ message: t('SUCCESS_FIELD_DELETED'), color: 'green' });
            onDelete();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_DELETE_FIELD_FAILED'), color: 'red' });
        }
    };

    const hasChanges = name !== field.name || showOnCard !== field.show_on_card;

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={field.name} onBack={onBack} />

            <div style={{ padding: '12px' }}>
                {/* Title */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        {t('UI_TITLE')}
                    </label>
                    <TextInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Type (read-only) */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        {t('UI_TYPE')}
                    </label>
                    <Text c="dimmed" style={{ textTransform: 'capitalize' }}>
                        {field.type}
                    </Text>
                </div>

                {/* Options for dropdown */}
                {field.type === 'dropdown' && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                            {t('UI_OPTIONS')}
                        </label>

                        {/* Existing options */}
                        {options.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                                {options.map((opt) => (
                                    <div
                                        key={opt.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            marginBottom: 4,
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: 4,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {opt.color && (
                                                <div
                                                    style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: 2,
                                                        backgroundColor: opt.color,
                                                    }}
                                                />
                                            )}
                                            <Text>{opt.value}</Text>
                                        </div>
                                        <Button
                                            variant="subtle"
                                            size="sm"
                                            leftSection={<IconTrash size={16} />}
                                            color="red"
                                            onClick={() => handleDeleteOption(opt.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new option */}
                        <div style={{ width: '100%' }}>
                            <TextInput
                                placeholder={t('UI_PLACEHOLDER_ADD_ITEM')}
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddOption(); }}
                            />
                            <Button
                                onClick={handleAddOption}
                                loading={addingOption}
                                disabled={!newOption.trim()}
                            >
                                {t('UI_ADD')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Show on card */}
                <div style={{ marginBottom: 20 }}>
                    <Checkbox
                        checked={showOnCard}
                        onChange={(e) => setShowOnCard(e.target.checked)}
                        label={t('UI_SHOW_FIELD_ON_CARD')}
                    />
                </div>

                {/* Save button */}
                <Button

                    fullWidth
                    onClick={handleSave}
                    loading={saving}
                    disabled={!hasChanges}
                    style={{ marginBottom: 12 }}
                >
                    {t('UI_SAVE')}
                </Button>

                <Divider style={{ margin: '12px 0' }} />

                {/* Delete button */}
                <Button
                    color="red"
                    fullWidth
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDelete}
                >
                    {t('UI_DELETE_FIELD')}
                </Button>
            </div>
        </div>
    );
}
