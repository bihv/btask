'use client';

import React, { useState } from 'react';
import { Input, Select, Button, Checkbox, message, Space, Tag } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { CustomField, CustomFieldType } from '@/types';
import { customFieldApi } from '@/lib/api';
import { ScreenHeader } from './MenuShared';

const { Option } = Select;

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
            message.error('Please enter a field name');
            return;
        }

        if (type === 'dropdown' && options.length === 0) {
            message.error('Please add at least one option for dropdown field');
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
            message.success('Custom field created');
            onCreate(response.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create field');
        } finally {
            setCreating(false);
        }
    };

    const isValid = name.trim() && (type !== 'dropdown' || options.length > 0);

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title="New field" onBack={onBack} />

            <div style={{ padding: '12px' }}>
                {/* Title */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        Title
                    </label>
                    <Input
                        placeholder="Add a title..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Type */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                        Type
                    </label>
                    <Select
                        value={type}
                        onChange={(value) => setType(value)}
                        style={{ width: '100%' }}
                    >
                        {fieldTypes.map((ft) => (
                            <Option key={ft.value} value={ft.value}>
                                {ft.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                {/* Options for dropdown */}
                {type === 'dropdown' && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                            Options
                        </label>

                        {/* Existing options */}
                        {options.length > 0 && (
                            <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {options.map((opt, index) => (
                                    <Tag
                                        key={index}
                                        closable
                                        onClose={() => handleRemoveOption(index)}
                                        style={{ marginRight: 0 }}
                                    >
                                        {opt}
                                    </Tag>
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

                {/* Create button */}
                <Button
                    type="primary"
                    block
                    onClick={handleCreate}
                    loading={creating}
                    disabled={!isValid}
                >
                    Create
                </Button>
            </div>
        </div>
    );
}
