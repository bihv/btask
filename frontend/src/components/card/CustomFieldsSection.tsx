'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { CustomField, CardCustomFieldValue } from '@/types';
import { customFieldApi } from '@/lib/api';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Select, Checkbox, TextInput, NumberInput, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconFlag, IconAlertTriangle, IconCircleCheck, IconForms, IconHash, IconCalendar } from '@tabler/icons-react';
interface CustomFieldsSectionProps {
    cardId: string;
    boardId: string;
}

// Get icon for field based on name or type
const getFieldIcon = (field: CustomField) => {
    const nameLower = field.name.toLowerCase();
    if (nameLower === 'priority') return <IconBolt size={16} />;
    if (nameLower === 'status') return <IconFlag size={16} />;
    if (nameLower === 'risk') return <IconAlertTriangle size={16} />;
    if (nameLower === 'effort') return <IconBolt size={16} style={{ transform: 'scaleX(-1)' }} />;

    switch (field.type) {
        case 'checkbox':
            return <IconCircleCheck size={16} />;
        case 'text':
            return <IconForms size={16} />;
        case 'number':
            return <IconHash size={16} />;
        case 'date':
            return <IconCalendar size={16} />;
        case 'dropdown':
            return <IconFlag size={16} />;
        default:
            return <IconFlag size={16} />;
    }
};

export default function CustomFieldsSection({ cardId, boardId }: CustomFieldsSectionProps) {
    const queryClient = useQueryClient();
    const t = useTranslation();
    const [fields, setFields] = useState<CustomField[]>([]);
    const [values, setValues] = useState<CardCustomFieldValue[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Load custom fields and values
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [fieldsRes, valuesRes] = await Promise.all([
                    customFieldApi.getByBoardId(boardId),
                    customFieldApi.getCardValues(cardId),
                ]);
                setFields(fieldsRes.data.data || []);
                setValues(valuesRes.data.data || []);
            } catch (error) {
                console.error('Failed to load custom fields:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [cardId, boardId]);

    // Get value for a field
    const getFieldValue = (fieldId: string) => {
        return values.find(v => v.custom_field_id === fieldId);
    };

    // Handle value change
    const handleValueChange = async (
        field: CustomField,
        newValue?: string,
        optionId?: string
    ) => {
        setSaving(field.id);
        try {
            await customFieldApi.setCardValue(cardId, field.id, {
                value: newValue,
                option_id: optionId,
            });

            // Update local state
            setValues(prev => {
                const existing = prev.find(v => v.custom_field_id === field.id);
                if (existing) {
                    return prev.map(v =>
                        v.custom_field_id === field.id
                            ? { ...v, value: newValue, option_id: optionId }
                            : v
                    );
                } else {
                    return [
                        ...prev,
                        {
                            id: `temp-${Date.now()}`,
                            card_id: cardId,
                            custom_field_id: field.id,
                            value: newValue,
                            option_id: optionId,
                        },
                    ];
                }
            });

            // Invalidate board cache so card shows updated values
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_FIELD'), color: 'red' });
        } finally {
            setSaving(null);
        }
    };

    // Clear value
    const handleClearValue = async (field: CustomField) => {
        setSaving(field.id);
        try {
            await customFieldApi.clearCardValue(cardId, field.id);
            setValues(prev => prev.filter(v => v.custom_field_id !== field.id));

            // Invalidate board cache
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_CLEAR_FIELD'), color: 'red' });
        } finally {
            setSaving(null);
        }
    };

    // Text field component with local state to avoid re-renders
    const TextFieldInput = ({ field, initialValue, isSaving }: {
        field: CustomField;
        initialValue: string;
        isSaving: boolean
    }) => {
        const [localValue, setLocalValue] = useState(initialValue);

        const handleSave = () => {
            if (localValue !== initialValue) {
                handleValueChange(field, localValue);
            }
        };

        return (
            <TextInput
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder={t('UI_PLACEHOLDER_ENTER_TEXT')}
                size="sm"
                disabled={isSaving}
            />
        );
    };

    // Number field component with local state
    const NumberFieldInput = ({ field, initialValue, isSaving }: {
        field: CustomField;
        initialValue: number | undefined;
        isSaving: boolean
    }) => {
        const [localValue, setLocalValue] = useState(initialValue);

        const handleSave = () => {
            const newValue = localValue?.toString();
            const oldValue = initialValue?.toString();
            if (newValue !== oldValue) {
                handleValueChange(field, newValue);
            }
        };

        return (
            <NumberInput
                value={localValue === undefined ? '' : localValue}
                onChange={(value) => setLocalValue(typeof value === 'number' ? value : undefined)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder={t('UI_PLACEHOLDER_ENTER_NUMBER')}
                size="sm"
                style={{ width: '100%' }}
                disabled={isSaving}
            />
        );
    };

    // Render field input based on type
    const renderFieldInput = (field: CustomField) => {
        const fieldValue = getFieldValue(field.id);
        const isSaving = saving === field.id;

        switch (field.type) {
            case 'checkbox':
                return (
                    <Checkbox
                        checked={fieldValue?.value === 'true'}
                        onChange={(e) =>
                            handleValueChange(field, e.target.checked ? 'true' : 'false')
                        }
                        disabled={isSaving}
                    />
                );

            case 'dropdown':
                return (
                    <Select
                        value={fieldValue?.option_id || null}
                        onChange={(value) => {
                            if (!value) handleClearValue(field);
                            else handleValueChange(field, undefined, value);
                        }}
                        clearable
                        placeholder={t('UI_PLACEHOLDER_SELECT')}
                        size="sm"
                        style={{ width: '100%' }}
                        disabled={isSaving}
                        data={field.options?.map(opt => ({
                            value: opt.id,
                            label: opt.value
                        })) || []}
                        renderOption={({ option }) => {
                            const opt = field.options?.find(o => o.id === option.value);
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {opt?.color && (
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: opt.color,
                                            }}
                                        />
                                    )}
                                    {option.label}
                                </div>
                            );
                        }}
                    />
                );

            case 'text':
                return (
                    <TextFieldInput
                        key={field.id}
                        field={field}
                        initialValue={fieldValue?.value || ''}
                        isSaving={isSaving}
                    />
                );

            case 'number':
                return (
                    <NumberFieldInput
                        key={field.id}
                        field={field}
                        initialValue={fieldValue?.value ? Number(fieldValue.value) : undefined}
                        isSaving={isSaving}
                    />
                );

            case 'date':
                return (
                    <DatePickerInput
                        value={fieldValue?.value ? new Date(fieldValue.value) : null}
                        onChange={(date: any) =>
                            handleValueChange(field, date ? new Date(date).toISOString() : undefined)
                        }
                        size="sm"
                        style={{ width: '100%' }}
                        disabled={isSaving}
                    />
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '8px 0' }}>
                <Loader size="sm" />
            </div>
        );
    }

    if (fields.length === 0) {
        return null; // Don't show section if no custom fields
    }

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconFlag size={16} style={{ color: 'var(--text-secondary)' }} />
                <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_CUSTOM_FIELDS')}</Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fields.map((field) => (
                    <div
                        key={field.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 100,
                            }}
                        >
                            <span style={{ opacity: 0.7, fontSize: 14 }}>
                                {getFieldIcon(field)}
                            </span>
                            <Text style={{ fontSize: 13 }}>{field.name}</Text>
                        </div>
                        <div style={{ flex: 1 }}>{renderFieldInput(field)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
