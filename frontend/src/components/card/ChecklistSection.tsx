'use client';

import React, { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Typography,
    Checkbox,
    Input,
    Button,
    Progress,
    Space,
    Dropdown,
    message,
    Avatar,
    Popover,
    DatePicker,
    Tag,
    Modal,
    Select,
} from 'antd';
import {
    CheckSquareOutlined,
    PlusOutlined,
    DeleteOutlined,
    MoreOutlined,
    UserOutlined,
    CalendarOutlined,
    SwapOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { Checklist, ChecklistItem, User, List } from '@/types';
import { checklistApi } from '@/lib/api';
import api from '@/lib/api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ChecklistSectionProps {
    cardId: string;
    boardId?: string;
    checklists: Checklist[];
    onUpdate: () => void;
    workspaceMembers?: User[];
    lists?: List[];
}

export default function ChecklistSection({
    cardId,
    boardId,
    checklists,
    onUpdate,
    workspaceMembers = [],
    lists = [],
}: ChecklistSectionProps) {
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
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
    const [modalLists, setModalLists] = useState<List[]>(lists);

    const { mode } = useTheme();

    // Helper to get initials from name (same as ShareModal)
    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';
    };

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
            message.success(date ? 'Due date set' : 'Due date removed');
        } catch (error) {
            message.error('Failed to update due date');
        }
    };

    const handleConvertToCard = async () => {
        if (!convertingItem || !selectedListId) return;
        try {
            await checklistApi.convertItemToCard(convertingItem.checklistId, convertingItem.item.id, selectedListId);
            message.success('Item converted to card');
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

        // Fetch fresh lists from API if boardId is available
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

        // Fallback to prop lists
        setModalLists(lists);
        setSelectedListId(lists.length > 0 ? lists[0].id : '');
    };

    const getProgress = (items: ChecklistItem[] = []) => {
        if (items.length === 0) return 0;
        const completed = items.filter(item => item.is_completed).length;
        return Math.round((completed / items.length) * 100);
    };

    const getDueDateColor = (dueDate: string) => {
        const due = dayjs(dueDate);
        const now = dayjs();
        if (due.isBefore(now, 'day')) return 'red';
        if (due.isSame(now, 'day')) return 'orange';
        if (due.diff(now, 'day') <= 2) return 'gold';
        return 'default';
    };

    // Shared UI component for member picker
    const MemberPickerUI = ({
        selectedIds,
        onToggle,
        onRemoveAll,
    }: {
        selectedIds: string[];
        onToggle: (userId: string) => void;
        onRemoveAll: () => void;
    }) => (
        <div style={{ width: 220, padding: 8 }}>
            <div style={{
                padding: '4px 8px',
                fontWeight: 600,
                fontSize: 12,
                color: mode === 'dark' ? '#9fadbc' : '#5e6c84',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                marginBottom: 8,
            }}>
                Members
            </div>
            {selectedIds.length > 0 && (
                <div
                    onClick={onRemoveAll}
                    style={{
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        marginBottom: 8,
                        color: '#cf1322',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <CloseOutlined style={{ fontSize: 12 }} /> Remove all ({selectedIds.length})
                </div>
            )}
            {workspaceMembers.map(member => {
                const isSelected = selectedIds.includes(member.id);
                return (
                    <div
                        key={member.id}
                        onClick={() => onToggle(member.id)}
                        style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: isSelected ? (mode === 'dark' ? '#1e3a5f' : '#e6f7ff') : undefined,
                        }}
                    >
                        <Avatar size={24} src={member.avatar_url || undefined} style={{ backgroundColor: '#0052cc' }}>
                            {getInitials(member.full_name || member.email || '')}
                        </Avatar>
                        <span style={{ flex: 1 }}>{member.full_name}</span>
                        {isSelected && <CheckSquareOutlined style={{ color: '#52c41a' }} />}
                    </div>
                );
            })}
            {workspaceMembers.length === 0 && (
                <div style={{ color: '#999', textAlign: 'center', padding: 8 }}>No members available</div>
            )}
        </div>
    );

    // Component cho edit item - với API sync
    const MemberPickerContent = ({ checklistId, item }: { checklistId: string; item: ChecklistItem }) => {
        const [selectedIds, setSelectedIds] = React.useState<string[]>(
            item.assignees?.map(a => a.user_id) || []
        );

        React.useEffect(() => {
            setSelectedIds(item.assignees?.map(a => a.user_id) || []);
        }, [item.assignees]);

        const handleToggle = async (userId: string) => {
            const isAssigned = selectedIds.includes(userId);
            const newIds = isAssigned
                ? selectedIds.filter(id => id !== userId)
                : [...selectedIds, userId];
            setSelectedIds(newIds);
            try {
                await checklistApi.updateItem(checklistId, item.id, { assignee_ids: newIds });
                onUpdate();
            } catch (error) {
                setSelectedIds(selectedIds);
                message.error('Failed to update assignees');
            }
        };

        const handleRemoveAll = async () => {
            const previousIds = selectedIds;
            setSelectedIds([]);
            try {
                await checklistApi.updateItem(checklistId, item.id, { assignee_ids: [] });
                onUpdate();
            } catch (error) {
                setSelectedIds(previousIds);
                message.error('Failed to remove assignees');
            }
        };

        return <MemberPickerUI selectedIds={selectedIds} onToggle={handleToggle} onRemoveAll={handleRemoveAll} />;
    };

    const renderMemberPicker = (checklistId: string, item: ChecklistItem) => {
        return <MemberPickerContent checklistId={checklistId} item={item} />;
    };

    const renderDueDatePicker = (checklistId: string, item: ChecklistItem) => (
        <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Due Date</div>
            <DatePicker
                value={item.due_date ? dayjs(item.due_date) : null}
                onChange={(date) => handleSetDueDate(checklistId, item.id, date ? date.toISOString() : null)}
                style={{ width: '100%' }}
                placeholder="Select due date"
            />
            {item.due_date && (
                <Button
                    size="small"
                    danger
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={() => handleSetDueDate(checklistId, item.id, null)}
                >
                    Remove due date
                </Button>
            )}
        </div>
    );
    const NewItemMemberPickerContent = ({ checklistId }: { checklistId: string }) => {
        const [selectedIds, setSelectedIds] = React.useState<string[]>(
            newItemAssignees[checklistId] || []
        );

        React.useEffect(() => {
            setSelectedIds(newItemAssignees[checklistId] || []);
        }, [checklistId]);

        const handleToggle = (userId: string) => {
            const isAssigned = selectedIds.includes(userId);
            const newIds = isAssigned
                ? selectedIds.filter(id => id !== userId)
                : [...selectedIds, userId];
            setSelectedIds(newIds);
            setNewItemAssignees({ ...newItemAssignees, [checklistId]: newIds });
        };

        const handleRemoveAll = () => {
            setSelectedIds([]);
            setNewItemAssignees({ ...newItemAssignees, [checklistId]: [] });
        };

        return <MemberPickerUI selectedIds={selectedIds} onToggle={handleToggle} onRemoveAll={handleRemoveAll} />;
    };

    const renderNewItemMemberPicker = (checklistId: string) => {
        return <NewItemMemberPickerContent checklistId={checklistId} />;
    };

    const renderNewItemDueDatePicker = (checklistId: string) => {
        const selectedDate = newItemDueDate[checklistId];
        return (
            <div style={{ padding: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Due Date</div>
                <DatePicker
                    value={selectedDate ? dayjs(selectedDate) : null}
                    onChange={(date) => setNewItemDueDate({ ...newItemDueDate, [checklistId]: date ? date.toISOString() : null })}
                    style={{ width: '100%' }}
                    placeholder="Select due date"
                />
                {selectedDate && (
                    <Button
                        size="small"
                        danger
                        style={{ marginTop: 8, width: '100%' }}
                        onClick={() => setNewItemDueDate({ ...newItemDueDate, [checklistId]: null })}
                    >
                        Remove due date
                    </Button>
                )}
            </div>
        );
    };

    const getItemMenuItems = (checklistId: string, item: ChecklistItem) => [
        {
            key: 'assign',
            label: (
                <Popover
                    content={renderMemberPicker(checklistId, item)}
                    trigger="click"
                    placement="rightTop"
                    destroyTooltipOnHide
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserOutlined /> Assign member
                    </div>
                </Popover>
            ),
        },
        {
            key: 'duedate',
            label: (
                <Popover
                    content={renderDueDatePicker(checklistId, item)}
                    trigger="click"
                    placement="rightTop"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarOutlined /> Set due date
                    </div>
                </Popover>
            ),
        },
        { type: 'divider' as const },
        {
            key: 'convert',
            label: 'Convert to card',
            icon: <SwapOutlined />,
            onClick: () => openConvertModal(checklistId, item),
        },
        { type: 'divider' as const },
        {
            key: 'delete',
            label: 'Delete',
            danger: true,
            icon: <DeleteOutlined />,
            onClick: () => handleDeleteItem(checklistId, item.id),
        },
    ];

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
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 4,
                                        padding: '8px 8px',
                                        borderRadius: 8,
                                        transition: 'background 0.2s',
                                        background: hoveredItemId === item.id
                                            ? (mode === 'dark' ? '#22272b' : '#ebecf0')
                                            : 'transparent',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={() => setHoveredItemId(item.id)}
                                    onMouseLeave={() => setHoveredItemId(null)}
                                >
                                    <Checkbox
                                        checked={item.is_completed}
                                        onChange={() => handleToggleItem(checklist.id, item.id)}
                                    />

                                    {/* Content - left side */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {editingItem === item.id ? (
                                            <div>
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
                                                    textDecoration: item.is_completed ? 'line-through' : 'none',
                                                    opacity: item.is_completed ? 0.5 : 1,
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
                                    </div>

                                    {/* Right side - Due date, Assignee, More menu */}
                                    {editingItem !== item.id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {/* Due Date */}
                                            {item.due_date && (
                                                <Popover
                                                    content={renderDueDatePicker(checklist.id, item)}
                                                    trigger="click"
                                                >
                                                    <Tag
                                                        color={getDueDateColor(item.due_date)}
                                                        icon={<CalendarOutlined />}
                                                        style={{
                                                            cursor: 'pointer',
                                                            margin: 0,
                                                            borderRadius: 4,
                                                        }}
                                                    >
                                                        {dayjs(item.due_date).format('MMM D')}
                                                    </Tag>
                                                </Popover>
                                            )}

                                            {/* Assignee Avatars */}
                                            {item.assignees && item.assignees.length > 0 && (
                                                <Popover
                                                    content={renderMemberPicker(checklist.id, item)}
                                                    trigger="click"
                                                    destroyTooltipOnHide
                                                >
                                                    <Avatar.Group
                                                        size={28}
                                                        max={{ count: 3 }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {item.assignees.map(assignee => (
                                                            <Avatar
                                                                key={assignee.id}
                                                                src={assignee.user?.avatar_url || undefined}
                                                                style={{ backgroundColor: '#0052cc' }}
                                                            >
                                                                {getInitials(assignee.user?.full_name || assignee.user?.email || '')}
                                                            </Avatar>
                                                        ))}
                                                    </Avatar.Group>
                                                </Popover>
                                            )}

                                            {/* More menu */}
                                            <Dropdown
                                                menu={{ items: getItemMenuItems(checklist.id, item) }}
                                                trigger={['click']}
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<MoreOutlined />}
                                                    style={{ opacity: 0.6 }}
                                                />
                                            </Dropdown>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Item Input */}
                            <div style={{ marginTop: 8 }}>
                                <Input.TextArea
                                    placeholder="Add an item"
                                    value={newItemContent[checklist.id] || ''}
                                    onChange={(e) => {
                                        setNewItemContent({
                                            ...newItemContent,
                                            [checklist.id]: e.target.value
                                        });
                                        if (e.target.value && addingItemToChecklist !== checklist.id) {
                                            setAddingItemToChecklist(checklist.id);
                                        }
                                    }}
                                    onFocus={() => setAddingItemToChecklist(checklist.id)}
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleAddItem(checklist.id);
                                        }
                                    }}
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    style={{
                                        resize: 'vertical',
                                        borderColor: addingItemToChecklist === checklist.id ? '#1677ff' : undefined,
                                    }}
                                />

                                {/* Selected assignees & due date badges */}
                                {addingItemToChecklist === checklist.id && ((newItemAssignees[checklist.id]?.length > 0) || newItemDueDate[checklist.id]) && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                        {newItemAssignees[checklist.id]?.map(assigneeId => {
                                            const member = workspaceMembers.find(m => m.id === assigneeId);
                                            return member ? (
                                                <Tag
                                                    key={member.id}
                                                    closable
                                                    onClose={() => setNewItemAssignees({
                                                        ...newItemAssignees,
                                                        [checklist.id]: newItemAssignees[checklist.id].filter(id => id !== assigneeId)
                                                    })}
                                                    icon={<Avatar size={14} src={member.avatar_url || undefined} style={{ marginRight: 4, backgroundColor: '#0052cc', fontSize: 8 }}>{getInitials(member.full_name || '')}</Avatar>}
                                                    style={{ display: 'flex', alignItems: 'center' }}
                                                >
                                                    {member.full_name}
                                                </Tag>
                                            ) : null;
                                        })}
                                        {newItemDueDate[checklist.id] && (
                                            <Tag
                                                closable
                                                onClose={() => setNewItemDueDate({ ...newItemDueDate, [checklist.id]: null })}
                                                icon={<CalendarOutlined />}
                                                color="blue"
                                            >
                                                {dayjs(newItemDueDate[checklist.id]).format('MMM D')}
                                            </Tag>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons row */}
                                {addingItemToChecklist === checklist.id && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginTop: 8,
                                        justifyContent: 'space-between'
                                    }}>
                                        <Space>
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => handleAddItem(checklist.id)}
                                                disabled={!newItemContent[checklist.id]?.trim()}
                                            >
                                                Add
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => clearNewItemForm(checklist.id)}
                                            >
                                                Cancel
                                            </Button>
                                        </Space>
                                        <Space>
                                            <Popover
                                                content={renderNewItemMemberPicker(checklist.id)}
                                                trigger="click"
                                                placement="bottomRight"
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<UserOutlined />}
                                                    style={{
                                                        color: newItemAssignees[checklist.id]?.length > 0 ? '#1677ff' : undefined
                                                    }}
                                                >
                                                    Assign
                                                </Button>
                                            </Popover>
                                            <Popover
                                                content={renderNewItemDueDatePicker(checklist.id)}
                                                trigger="click"
                                                placement="bottomRight"
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CalendarOutlined />}
                                                    style={{
                                                        color: newItemDueDate[checklist.id] ? '#1677ff' : undefined
                                                    }}
                                                >
                                                    Due date
                                                </Button>
                                            </Popover>
                                        </Space>
                                    </div>
                                )}
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

            {/* Convert to Card Modal */}
            <Modal
                title="Convert to Card"
                open={convertModalVisible}
                onOk={handleConvertToCard}
                onCancel={() => {
                    setConvertModalVisible(false);
                    setConvertingItem(null);
                    setSelectedListId('');
                }}
                okText="Convert"
                okButtonProps={{ disabled: !selectedListId }}
            >
                {convertingItem && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Converting: </Text>
                            <Text>{convertingItem.item.content}</Text>
                        </div>
                        {convertingItem.item.assignees && convertingItem.item.assignees.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary">Assignees will be added as card members: </Text>
                                {convertingItem.item.assignees.map(a => (
                                    <Tag key={a.id} icon={<UserOutlined />}>{a.user?.full_name}</Tag>
                                ))}
                            </div>
                        )}
                        {convertingItem.item.due_date && (
                            <div style={{ marginBottom: 16 }}>
                                <Text type="secondary">Due date: </Text>
                                <Tag icon={<CalendarOutlined />}>{dayjs(convertingItem.item.due_date).format('MMM D, YYYY')}</Tag>
                            </div>
                        )}
                        <div style={{ marginBottom: 8 }}>
                            <Text strong>Select target list:</Text>
                        </div>
                        <Select
                            value={selectedListId}
                            onChange={setSelectedListId}
                            style={{ width: '100%' }}
                            placeholder="Select a list"
                        >
                            {modalLists.map(list => (
                                <Select.Option key={list.id} value={list.id}>
                                    {list.title}
                                </Select.Option>
                            ))}
                        </Select>
                        {modalLists.length === 0 && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                No lists available. Please create a list first.
                            </Text>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
