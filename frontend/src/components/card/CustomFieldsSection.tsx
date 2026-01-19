'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Select, Checkbox, Input, DatePicker, InputNumber, Spin, App } from 'antd';
import {
    ThunderboltOutlined,
    FlagOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    FieldStringOutlined,
    NumberOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { CustomField, CardCustomFieldValue } from '@/types';
import { customFieldApi } from '@/lib/api';

const { Text } = Typography;

interface CustomFieldsSectionProps {
    cardId: string;
    boardId: string;
}

// Get icon for field based on name or type
const getFieldIcon = (field: CustomField) => {
    const nameLower = field.name.toLowerCase();
    if (nameLower === 'priority') return <ThunderboltOutlined />;
    if (nameLower === 'status') return <FlagOutlined />;
    if (nameLower === 'risk') return <WarningOutlined />;
    if (nameLower === 'effort') return <ThunderboltOutlined style={{ transform: 'scaleX(-1)' }} />;

    switch (field.type) {
        case 'checkbox':
            return <CheckCircleOutlined />;
        case 'text':
            return <FieldStringOutlined />;
        case 'number':
            return <NumberOutlined />;
        case 'date':
            return <CalendarOutlined />;
        case 'dropdown':
            return <FlagOutlined />;
        default:
            return <FlagOutlined />;
    }
};

export default function CustomFieldsSection({ cardId, boardId }: CustomFieldsSectionProps) {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
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
            message.error('Failed to update field');
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
            message.error('Failed to clear field');
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
            <Input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onPressEnter={handleSave}
                placeholder="Enter text..."
                size="small"
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
            <InputNumber
                value={localValue}
                onChange={(value) => setLocalValue(value ?? undefined)}
                onBlur={handleSave}
                onPressEnter={handleSave}
                placeholder="Enter number..."
                size="small"
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
                        value={fieldValue?.option_id || undefined}
                        onChange={(value) => handleValueChange(field, undefined, value)}
                        allowClear
                        onClear={() => handleClearValue(field)}
                        placeholder="Select..."
                        size="small"
                        style={{ width: '100%' }}
                        loading={isSaving}
                        options={field.options?.map(opt => ({
                            value: opt.id,
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {opt.color && (
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: opt.color,
                                            }}
                                        />
                                    )}
                                    {opt.value}
                                </div>
                            ),
                        }))}
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
                    <DatePicker
                        value={fieldValue?.value ? dayjs(fieldValue.value) : null}
                        onChange={(date) =>
                            handleValueChange(field, date?.toISOString())
                        }
                        size="small"
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
                <Spin size="small" />
            </div>
        );
    }

    if (fields.length === 0) {
        return null; // Don't show section if no custom fields
    }

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FlagOutlined style={{ color: 'var(--text-secondary)' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>Custom Fields</Text>
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
