'use client';

import React, { useState } from 'react';
import { Input, Button, Checkbox, Space, Tag, Modal, Typography, Divider, App } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { CustomField, CustomFieldOption } from '@/types';
import { customFieldApi } from '@/lib/api';
import { ScreenHeader } from './MenuShared';

const { Text } = Typography;

interface EditFieldScreenProps {
    field: CustomField;
    onBack: () => void;
    onUpdate: (field: CustomField) => void;
    onDelete: () => void;
}

export default function EditFieldScreen({ field, onBack, onUpdate, onDelete }: EditFieldScreenProps) {
    const { modal, message } = App.useApp();
    const [name, setName] = useState(field.name);
    const [showOnCard, setShowOnCard] = useState(field.show_on_card);
    const [options, setOptions] = useState<CustomFieldOption[]>(field.options || []);
    const [newOption, setNewOption] = useState('');
    const [saving, setSaving] = useState(false);
    const [addingOption, setAddingOption] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            message.error('Please enter a field name');
            return;
        }

        setSaving(true);
        try {
            const response = await customFieldApi.update(field.id, {
                name: name.trim(),
                show_on_card: showOnCard,
            });
            message.success('Field updated');
            onUpdate(response.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to update field');
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
            message.success('Option added');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to add option');
        } finally {
            setAddingOption(false);
        }
    };

    const handleDeleteOption = async (optionId: string) => {
        try {
            await customFieldApi.deleteOption(optionId);
            setOptions(options.filter(o => o.id !== optionId));
            message.success('Option deleted');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to delete option');
        }
    };

    const handleDelete = () => {
        modal.confirm({
            title: 'Delete this custom field?',
            icon: <ExclamationCircleOutlined />,
            content: 'This will remove this field and all its values from all cards in this board.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await customFieldApi.delete(field.id);
                    message.success('Field deleted');
                    onDelete();
                } catch (error: any) {
                    message.error(error.response?.data?.error || 'Failed to delete field');
                }
            },
        });
    };

    const hasChanges = name !== field.name || showOnCard !== field.show_on_card;

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={field.name} onBack={onBack} />

            <div style={{ padding: '12px' }}>
                {/* Title */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        Title
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Type (read-only) */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        Type
                    </label>
                    <Text type="secondary" style={{ textTransform: 'capitalize' }}>
                        {field.type}
                    </Text>
                </div>

                {/* Options for dropdown */}
                {field.type === 'dropdown' && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                            Options
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
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            danger
                                            onClick={() => handleDeleteOption(opt.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new option */}
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Add item..."
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                onPressEnter={handleAddOption}
                            />
                            <Button
                                onClick={handleAddOption}
                                loading={addingOption}
                                disabled={!newOption.trim()}
                            >
                                Add
                            </Button>
                        </Space.Compact>
                    </div>
                )}

                {/* Show on card */}
                <div style={{ marginBottom: 20 }}>
                    <Checkbox
                        checked={showOnCard}
                        onChange={(e) => setShowOnCard(e.target.checked)}
                    >
                        Show field on front of card
                    </Checkbox>
                </div>

                {/* Save button */}
                <Button
                    type="primary"
                    block
                    onClick={handleSave}
                    loading={saving}
                    disabled={!hasChanges}
                    style={{ marginBottom: 12 }}
                >
                    Save
                </Button>

                <Divider style={{ margin: '12px 0' }} />

                {/* Delete button */}
                <Button
                    danger
                    block
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                >
                    Delete field
                </Button>
            </div>
        </div>
    );
}
