'use client';

import React, { useState } from 'react';
import { Input, Button, Typography, Divider, App } from 'antd';
import { CheckOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Label } from '@/types';
import api from '@/lib/api';

const { Text } = Typography;

const LABEL_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface LabelPickerProps {
    boardId: string;
    labels: Label[];
    selectedLabelIds: string[];
    onToggle: (labelId: string) => void;
    onRefresh: () => void;
    onCardRefresh?: () => void;  // To refresh card data after label changes
}

type View = 'list' | 'create' | 'edit';

export default function LabelPicker({
    boardId,
    labels,
    selectedLabelIds,
    onToggle,
    onRefresh,
    onCardRefresh,
}: LabelPickerProps) {
    const [view, setView] = useState<View>('list');
    const { message } = App.useApp();
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    
    // Form states
    const [name, setName] = useState('');
    const [color, setColor] = useState(LABEL_COLORS[0]);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setColor(LABEL_COLORS[0]);
        setEditingLabel(null);
    };

    const handleStartCreate = () => {
        resetForm();
        setView('create');
    };

    const handleStartEdit = (label: Label, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLabel(label);
        setName(label.name || '');
        setColor(label.color);
        setView('edit');
    };

    const handleBack = () => {
        resetForm();
        setView('list');
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            await api.post(`/boards/${boardId}/labels`, {
                name: name || undefined,
                color,
            });
            onRefresh();
            handleBack();
        } catch (error) {
            message.error('Failed to create label');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLabel) return;
        setLoading(true);
        try {
            await api.put(`/labels/${editingLabel.id}`, {
                name: name || undefined,
                color,
            });
            onRefresh();
            onCardRefresh?.();  // Refresh card to show updated label
            handleBack();
        } catch (error) {
            message.error('Failed to update label');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingLabel) return;
        setLoading(true);
        try {
            await api.delete(`/labels/${editingLabel.id}`);
            onRefresh();
            onCardRefresh?.();  // Refresh card to remove deleted label
            handleBack();
            message.success('Label deleted');
        } catch (error) {
            message.error('Failed to delete label');
        } finally {
            setLoading(false);
        }
    };

    // List View
    if (view === 'list') {
        return (
            <div style={{ width: 280 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Labels</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {labels.map((label) => {
                        const isSelected = selectedLabelIds.includes(label.id);
                        return (
                            <div
                                key={label.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {/* Label color bar (clickable to toggle) */}
                                <div
                                    onClick={() => onToggle(label.id)}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 4,
                                        backgroundColor: label.color,
                                        cursor: 'pointer',
                                        color: 'white',
                                    }}
                                >
                                    <span style={{ flex: 1 }}>{label.name || ''}</span>
                                    {isSelected && <CheckOutlined />}
                                </div>
                                {/* Edit button */}
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={(e) => handleStartEdit(label, e)}
                                    style={{ 
                                        color: 'var(--text-secondary)',
                                        minWidth: 32,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                <Button type="default" block onClick={handleStartCreate}>
                    Create a new label
                </Button>
            </div>
        );
    }

    // Create/Edit View
    return (
        <div style={{ width: 280 }}>
            {/* Header with back button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Button
                    type="text"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                />
                <Text strong>{view === 'create' ? 'Create label' : 'Edit label'}</Text>
            </div>

            {/* Preview */}
            <div
                style={{
                    padding: '10px 12px',
                    borderRadius: 4,
                    backgroundColor: color,
                    color: 'white',
                    marginBottom: 12,
                    minHeight: 32,
                }}
            >
                {name || ''}
            </div>

            {/* Name input */}
            <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Title
                </Text>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Label name (optional)"
                    size="small"
                />
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Select a color
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {LABEL_COLORS.map((c) => (
                        <div
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: 48,
                                height: 32,
                                borderRadius: 4,
                                backgroundColor: c,
                                cursor: 'pointer',
                                border: color === c ? '2px solid #000' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {color === c && <CheckOutlined style={{ color: 'white' }} />}
                        </div>
                    ))}
                </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    type="primary"
                    onClick={view === 'create' ? handleCreate : handleUpdate}
                    loading={loading}
                >
                    {view === 'create' ? 'Create' : 'Save'}
                </Button>
                {view === 'edit' && (
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                        loading={loading}
                    >
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
}
