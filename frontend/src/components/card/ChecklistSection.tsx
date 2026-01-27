'use client';

import React, { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Input, Button, Space, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Checklist, ChecklistItem, User, BoardList } from '@/types';
import { checklistApi } from '@/lib/api';
import api from '@/lib/api';

import {
    ChecklistHeader,
    ChecklistItemRow,
    NewChecklistItemForm,
    ConvertToCardModal,
} from './checklist';

interface ChecklistSectionProps {
    cardId: string;
    boardId?: string;
    checklists: Checklist[];
    onUpdate: () => void;
    workspaceMembers?: User[];
    lists?: BoardList[];
    triggerAddChecklist?: boolean;
    onAddChecklistTriggered?: () => void;
}

export default function ChecklistSection({
    cardId,
    boardId,
    checklists,
    onUpdate,
    workspaceMembers = [],
    lists = [],
    triggerAddChecklist = false,
    onAddChecklistTriggered,
}: ChecklistSectionProps) {
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const { message } = App.useApp();
    const [showAddChecklist, setShowAddChecklist] = useState(false);
    const [newItemContent, setNewItemContent] = useState<Record<string, string>>({});
    const [newItemAssignees, setNewItemAssignees] = useState<Record<string, string[]>>({});
    const [newItemDueDate, setNewItemDueDate] = useState<Record<string, string | null>>({});
    const [addingItemToChecklist, setAddingItemToChecklist] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [convertModalVisible, setConvertModalVisible] = useState(false);
    const [convertingItem, setConvertingItem] = useState<{ checklistId: string; item: ChecklistItem } | null>(null);
    const [selectedListId, setSelectedListId] = useState<string>('');
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
    const [modalLists, setModalLists] = useState<BoardList[]>(lists);

    const { resolvedTheme } = useTheme();

    // Handle trigger from parent
    React.useEffect(() => {
        if (triggerAddChecklist && !showAddChecklist) {
            setShowAddChecklist(true);
            onAddChecklistTriggered?.();
        }
    }, [triggerAddChecklist, showAddChecklist, onAddChecklistTriggered]);

    // API Handlers
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
            await checklistApi.createItem(checklistId, {
                content,
                assignee_ids: newItemAssignees[checklistId]?.length ? newItemAssignees[checklistId] : undefined,
                due_date: newItemDueDate[checklistId] || undefined,
            });
            clearNewItemForm(checklistId);
            onUpdate();
        } catch (error) {
            message.error('Failed to add item');
        }
    };

    const clearNewItemForm = (checklistId: string) => {
        setNewItemContent({ ...newItemContent, [checklistId]: '' });
        setNewItemAssignees({ ...newItemAssignees, [checklistId]: [] });
        setNewItemDueDate({ ...newItemDueDate, [checklistId]: null });
        setAddingItemToChecklist(null);
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

    const handleAssignMember = async (checklistId: string, itemId: string, userId: string, currentAssigneeIds: string[]) => {
        try {
            const isAssigned = currentAssigneeIds.includes(userId);
            const newAssigneeIds = isAssigned
                ? currentAssigneeIds.filter(id => id !== userId)
                : [...currentAssigneeIds, userId];
            await checklistApi.updateItem(checklistId, itemId, { assignee_ids: newAssigneeIds });
            onUpdate();
        } catch (error) {
            message.error('Failed to update assignees');
        }
    };

    const handleRemoveAllAssignees = async (checklistId: string, itemId: string) => {
        try {
            await checklistApi.updateItem(checklistId, itemId, { assignee_ids: [] });
            onUpdate();
        } catch (error) {
            message.error('Failed to remove assignees');
        }
    };

    const handleSetDueDate = async (checklistId: string, itemId: string, date: string | null) => {
        try {
            await checklistApi.updateItem(checklistId, itemId, { due_date: date });
            onUpdate();
        } catch (error) {
            message.error('Failed to update due date');
        }
    };

    const handleConvertToCard = async () => {
        if (!convertingItem || !selectedListId) return;
        try {
            await checklistApi.convertItemToCard(convertingItem.checklistId, convertingItem.item.id, selectedListId);
            setConvertModalVisible(false);
            setConvertingItem(null);
            setSelectedListId('');
            onUpdate();
        } catch (error) {
            message.error('Failed to convert to card');
        }
    };

    const openConvertModal = async (checklistId: string, item: ChecklistItem) => {
        setConvertingItem({ checklistId, item });
        setConvertModalVisible(true);

        if (boardId) {
            try {
                const boardRes = await api.get(`/boards/${boardId}`);
                const freshLists = boardRes.data.data.lists || [];
                setModalLists(freshLists);
                setSelectedListId(freshLists.length > 0 ? freshLists[0].id : '');
                return;
            } catch (error) {
                console.error('Failed to fetch fresh lists:', error);
            }
        }

        setModalLists(lists);
        setSelectedListId(lists.length > 0 ? lists[0].id : '');
    };

    // Utility functions
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
                        <ChecklistHeader
                            title={checklist.title}
                            progress={progress}
                            onDelete={() => handleDeleteChecklist(checklist.id)}
                        />

                        {/* Checklist Items */}
                        <div style={{ marginLeft: 24 }}>
                            {checklist.items?.map((item) => (
                                <ChecklistItemRow
                                    key={item.id}
                                    item={item}
                                    checklistId={checklist.id}
                                    mode={resolvedTheme}
                                    workspaceMembers={workspaceMembers}
                                    isHovered={hoveredItemId === item.id}
                                    isEditing={editingItem === item.id}
                                    editingContent={editingContent}
                                    onMouseEnter={() => setHoveredItemId(item.id)}
                                    onMouseLeave={() => setHoveredItemId(null)}
                                    onToggle={() => handleToggleItem(checklist.id, item.id)}
                                    onStartEdit={() => {
                                        setEditingItem(item.id);
                                        setEditingContent(item.content);
                                    }}
                                    onEditContentChange={setEditingContent}
                                    onSaveEdit={() => handleUpdateItem(checklist.id, item.id)}
                                    onCancelEdit={() => {
                                        setEditingItem(null);
                                        setEditingContent('');
                                    }}
                                    onAssignMember={(userId, currentIds) => handleAssignMember(checklist.id, item.id, userId, currentIds)}
                                    onRemoveAllAssignees={() => handleRemoveAllAssignees(checklist.id, item.id)}
                                    onSetDueDate={(date) => handleSetDueDate(checklist.id, item.id, date)}
                                    onConvertToCard={() => openConvertModal(checklist.id, item)}
                                    onDelete={() => handleDeleteItem(checklist.id, item.id)}
                                    onUpdateData={onUpdate}
                                />
                            ))}

                            <NewChecklistItemForm
                                checklistId={checklist.id}
                                mode={resolvedTheme}
                                workspaceMembers={workspaceMembers}
                                isActive={addingItemToChecklist === checklist.id}
                                content={newItemContent[checklist.id] || ''}
                                assigneeIds={newItemAssignees[checklist.id] || []}
                                dueDate={newItemDueDate[checklist.id] || null}
                                onContentChange={(content) => setNewItemContent({ ...newItemContent, [checklist.id]: content })}
                                onAssigneeIdsChange={(ids) => setNewItemAssignees({ ...newItemAssignees, [checklist.id]: ids })}
                                onDueDateChange={(date) => setNewItemDueDate({ ...newItemDueDate, [checklist.id]: date })}
                                onFocus={() => setAddingItemToChecklist(checklist.id)}
                                onSubmit={() => handleAddItem(checklist.id)}
                                onCancel={() => clearNewItemForm(checklist.id)}
                            />
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

            {/* Convert to Card Modal */}
            <ConvertToCardModal
                visible={convertModalVisible}
                item={convertingItem?.item || null}
                lists={modalLists}
                selectedListId={selectedListId}
                onListChange={setSelectedListId}
                onConvert={handleConvertToCard}
                onCancel={() => {
                    setConvertModalVisible(false);
                    setConvertingItem(null);
                    setSelectedListId('');
                }}
            />
        </div>
    );
}
