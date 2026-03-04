'use client';

import { useTranslation } from '@/hooks/useLabels';
import { customFieldApi } from '@/lib/api';
import { CustomField, CustomFieldType } from '@/types';
import { useState } from 'react';
import { ScreenHeader } from './MenuShared';

import { Badge, Button, Checkbox, Select, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';


const fieldTypes: { value: CustomFieldType; label: string }[] = [
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'text', label: 'Text' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
];

interface NewFieldScreenProps {
    boardId: string;
    onBack: () => void;
    onCreate: (field: CustomField) => void;
}

export default function NewFieldScreen({ boardId, onBack, onCreate }: NewFieldScreenProps) {
    const t = useTranslation();
    const [name, setName] = useState('');
    const [type, setType] = useState<CustomFieldType>('text');
    const [showOnCard, setShowOnCard] = useState(true);
    const [options, setOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');
    const [creating, setCreating] = useState(false);

    const handleAddOption = () => {
        if (newOption.trim() && !options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()]);
            setNewOption('');
        }
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            notifications.show({ title: 'Error', message: t('ERROR_FIELD_NAME_REQUIRED'), color: 'red' });
            return;
        }

        if (type === 'dropdown' && options.length === 0) {
            notifications.show({ title: 'Error', message: t('ERROR_DROPDOWN_OPTIONS_REQUIRED'), color: 'red' });
            return;
        }

        setCreating(true);
        try {
            const response = await customFieldApi.create(boardId, {
                name: name.trim(),
                type,
                show_on_card: showOnCard,
                options: type === 'dropdown' ? options : undefined,
            });
            onCreate(response.data.data);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_CREATE_FIELD_FAILED'), color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    const isValid = name.trim() && (type !== 'dropdown' || options.length > 0);

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={t('UI_NEW_FIELD')} onBack={onBack} />

            <div style={{ padding: '12px' }}>
                {/* Title */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        {t('UI_TITLE')}
                    </label>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_ADD_TITLE')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Type */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        {t('UI_TYPE')}
                    </label>
                    <Select
                        value={type}
                        onChange={(value) => { if (value) setType(value as CustomFieldType); }}
                        data={fieldTypes.map(ft => ({ value: ft.value, label: ft.label }))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Options for dropdown */}
                {type === 'dropdown' && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                            {t('UI_OPTIONS')}
                        </label>

                        {/* Existing options */}
                        {options.length > 0 && (
                            <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {options.map((opt, index) => (
                                    <Badge
                                        key={index}
                                        rightSection={
                                            <IconX size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveOption(index)} />
                                        }
                                        style={{ marginRight: 0 }}
                                    >
                                        {opt}
                                    </Badge>
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

                {/* Create button */}
                <Button

                    fullWidth
                    onClick={handleCreate}
                    loading={creating}
                    disabled={!isValid}
                >
                    {t('UI_CREATE')}
                </Button>
            </div>
        </div>
    );
}
