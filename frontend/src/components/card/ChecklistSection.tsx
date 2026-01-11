'use client';

import React, { useState } from 'react';
import {
    Typography,
    Checkbox,
    Input,
    Button,
    Progress,
    Space,
    Dropdown,
    message,
} from 'antd';
import {
    CheckSquareOutlined,
    PlusOutlined,
    DeleteOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { Checklist, ChecklistItem } from '@/types';
import { checklistApi } from '@/lib/api';

const { Text } = Typography;

interface ChecklistSectionProps {
    cardId: string;
    checklists: Checklist[];
    onUpdate: () => void;
}

export default function ChecklistSection({ cardId, checklists, onUpdate }: ChecklistSectionProps) {
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [showAddChecklist, setShowAddChecklist] = useState(false);
    const [newItemContent, setNewItemContent] = useState<Record<string, string>>({});
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    const handleAddChecklist = async () => {
        if (!newChecklistTitle.trim()) return;
        try {
            await checklistApi.create(cardId, { title: newChecklistTitle.trim() });
            setNewChecklistTitle('');
            setShowAddChecklist(false);
            onUpdate();
        } catch (error) {
            message.error('Failed to create checklist');
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        try {
            await checklistApi.delete(checklistId);
            onUpdate();
        } catch (error) {
            message.error('Failed to delete checklist');
        }
    };

    const handleAddItem = async (checklistId: string) => {
        const content = newItemContent[checklistId]?.trim();
        if (!content) return;
        try {
            await checklistApi.createItem(checklistId, { content });
            setNewItemContent({ ...newItemContent, [checklistId]: '' });
            onUpdate();
        } catch (error) {
            message.error('Failed to add item');
        }
    };

    const handleToggleItem = async (checklistId: string, itemId: string) => {
        try {
            await checklistApi.toggleItem(checklistId, itemId);
            onUpdate();
        } catch (error) {
            message.error('Failed to update item');
        }
    };

    const handleUpdateItem = async (checklistId: string, itemId: string) => {
        if (!editingContent.trim()) return;
        try {
            await checklistApi.updateItem(checklistId, itemId, { content: editingContent.trim() });
            setEditingItem(null);
            setEditingContent('');
            onUpdate();
        } catch (error) {
            message.error('Failed to update item');
        }
    };

    const handleDeleteItem = async (checklistId: string, itemId: string) => {
        try {
            await checklistApi.deleteItem(checklistId, itemId);
            onUpdate();
        } catch (error) {
            message.error('Failed to delete item');
        }
    };

    const getProgress = (items: ChecklistItem[] = []) => {
        if (items.length === 0) return 0;
        const completed = items.filter(item => item.is_completed).length;
        return Math.round((completed / items.length) * 100);
    };

    return (
        <div>
            {checklists.map((checklist) => {
                const progress = getProgress(checklist.items);
                return (
                    <div key={checklist.id} style={{ marginBottom: 24 }}>
                        {/* Checklist Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <CheckSquareOutlined />
                            <Text strong style={{ flex: 1 }}>{checklist.title}</Text>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'delete',
                                            label: 'Delete',
                                            danger: true,
                                            icon: <DeleteOutlined />,
                                            onClick: () => handleDeleteChecklist(checklist.id),
                                        },
                                    ],
                                }}
                                trigger={['click']}
                            >
                                <Button type="text" size="small" icon={<MoreOutlined />} />
                            </Dropdown>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 11, minWidth: 32 }}>
                                {progress}%
                            </Text>
                            <Progress
                                percent={progress}
                                showInfo={false}
                                size="small"
                                strokeColor={progress === 100 ? '#52c41a' : undefined}
                            />
                        </div>

                        {/* Checklist Items */}
                        <div style={{ marginLeft: 24 }}>
                            {checklist.items?.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 8,
                                        marginBottom: 8,
                                        padding: '4px 0',
                                    }}
                                >
                                    <Checkbox
                                        checked={item.is_completed}
                                        onChange={() => handleToggleItem(checklist.id, item.id)}
                                    />
                                    {editingItem === item.id ? (
                                        <div style={{ flex: 1 }}>
                                            <Input.TextArea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                autoSize={{ minRows: 1, maxRows: 4 }}
                                                autoFocus
                                            />
                                            <Space style={{ marginTop: 4 }}>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    onClick={() => handleUpdateItem(checklist.id, item.id)}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingItem(null);
                                                        setEditingContent('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </Space>
                                        </div>
                                    ) : (
                                        <Text
                                            style={{
                                                flex: 1,
                                                textDecoration: item.is_completed ? 'line-through' : 'none',
                                                opacity: item.is_completed ? 0.6 : 1,
                                                cursor: 'pointer',
                                                wordBreak: 'break-word',
                                            }}
                                            onClick={() => {
                                                setEditingItem(item.id);
                                                setEditingContent(item.content);
                                            }}
                                        >
                                            {item.content}
                                        </Text>
                                    )}
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                                        style={{ opacity: 0.5 }}
                                    />
                                </div>
                            ))}

                            {/* Add Item Input */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <Input
                                    placeholder="Add an item..."
                                    value={newItemContent[checklist.id] || ''}
                                    onChange={(e) => setNewItemContent({
                                        ...newItemContent,
                                        [checklist.id]: e.target.value
                                    })}
                                    onPressEnter={() => handleAddItem(checklist.id)}
                                    size="small"
                                />
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleAddItem(checklist.id)}
                                    disabled={!newItemContent[checklist.id]?.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Add Checklist Button/Form */}
            {showAddChecklist ? (
                <div style={{ marginTop: 16 }}>
                    <Input
                        placeholder="Checklist title..."
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onPressEnter={handleAddChecklist}
                        autoFocus
                    />
                    <Space style={{ marginTop: 8 }}>
                        <Button type="primary" onClick={handleAddChecklist}>
                            Add
                        </Button>
                        <Button onClick={() => {
                            setShowAddChecklist(false);
                            setNewChecklistTitle('');
                        }}>
                            Cancel
                        </Button>
                    </Space>
                </div>
            ) : (
                <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddChecklist(true)}
                    style={{ marginTop: checklists.length > 0 ? 16 : 0 }}
                >
                    Add Checklist
                </Button>
            )}
        </div>
    );
}
