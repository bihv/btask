'use client';

import React, { useState, useEffect } from 'react';
import {
    Typography,
    Checkbox,
    Input,
    Button,
    Space,
    Dropdown,
    DatePicker,
    Tag,
    Modal,
    App,
} from 'antd';
import {
    UserOutlined,
    CalendarOutlined,
    SwapOutlined,
    DeleteOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { ChecklistItem as ChecklistItemType, User } from '@/types';
import dayjs from 'dayjs';
import MemberPickerModal from '@/components/common/MemberPickerModal';
import { checklistApi } from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

const { Text } = Typography;

interface ChecklistItemRowProps {
    item: ChecklistItemType;
    checklistId: string;
    mode: 'dark' | 'light';
    workspaceMembers: User[];
    isHovered: boolean;
    isEditing: boolean;
    editingContent: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onToggle: () => void;
    onStartEdit: () => void;
    onEditContentChange: (content: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onAssignMember: (userId: string, currentAssigneeIds: string[]) => void;
    onRemoveAllAssignees: () => void;
    onSetDueDate: (date: string | null) => void;
    onConvertToCard: () => void;
    onDelete: () => void;
    onUpdateData: () => void;
}

// Component for due date picker with proper close handling
function DueDatePickerContent({
    checklistId,
    item,
    onUpdate,
    onClose,
}: {
    checklistId: string;
    item: ChecklistItemType;
    onUpdate: () => void;
    onClose: () => void;
}) {
    const { message } = App.useApp();
    const t = useTranslation();
    const handleDateChange = async (date: dayjs.Dayjs | null) => {
        try {
            await checklistApi.updateItem(checklistId, item.id, {
                due_date: date ? date.toISOString() : null
            });
            onUpdate();
            // Use setTimeout to ensure state update completes before closing
            setTimeout(() => {
                onClose();
            }, 0);
        } catch (error) {
            message.error(t('ERROR_UPDATE_DUE_DATE'));
        }
    };

    const handleRemoveDueDate = async () => {
        try {
            await checklistApi.updateItem(checklistId, item.id, { clear_due_date: true });
            onUpdate();
            // Use setTimeout to ensure state update completes before closing
            setTimeout(() => {
                onClose();
            }, 0);
        } catch (error) {
            message.error(t('ERROR_UPDATE_DUE_DATE'));
        }
    };

    return (
        <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('UI_DUE_DATE_LABEL')}</div>
            <DatePicker
                value={item.due_date ? dayjs(item.due_date) : null}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                placeholder={t('UI_SELECT_DUE_DATE')}
            />
            {item.due_date && (
                <Button
                    size="small"
                    danger
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={handleRemoveDueDate}
                >
                    {t('UI_REMOVE_DUE_DATE')}
                </Button>
            )}
        </div>
    );
}

export default function ChecklistItemRow({
    item,
    checklistId,
    mode,
    workspaceMembers,
    isHovered,
    isEditing,
    editingContent,
    onMouseEnter,
    onMouseLeave,
    onToggle,
    onStartEdit,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onAssignMember,
    onRemoveAllAssignees,
    onSetDueDate,
    onConvertToCard,
    onDelete,
    onUpdateData,
}: ChecklistItemRowProps) {
    const { message } = App.useApp();
    const t2 = useTranslation();
    const token = useAppToken();
    const [dueDateModalOpen, setDueDateModalOpen] = useState(false);
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>(
        item.assignees?.map(a => a.user_id) || []
    );

    // Sync with external data when item changes
    useEffect(() => {
        setSelectedIds(item.assignees?.map(a => a.user_id) || []);
    }, [item.assignees]);

    const closeDueDateModal = React.useCallback(() => {
        setDueDateModalOpen(false);
    }, []);

    const closeMemberModal = React.useCallback(() => {
        setMemberModalOpen(false);
    }, []);

    const handleToggleMember = async (userId: string) => {
        const isAssigned = selectedIds.includes(userId);
        const newIds = isAssigned
            ? selectedIds.filter(id => id !== userId)
            : [...selectedIds, userId];

        // Optimistic update
        setSelectedIds(newIds);

        try {
            await checklistApi.updateItem(checklistId, item.id, { assignee_ids: newIds });
            onUpdateData();
        } catch (error) {
            // Rollback on error
            setSelectedIds(selectedIds);
            message.error(t2('ERROR_UPDATE_ASSIGNEES'));
        }
    };

    const handleRemoveAllAssignees = async () => {
        const previousIds = selectedIds;
        // Optimistic update
        setSelectedIds([]);

        try {
            await checklistApi.updateItem(checklistId, item.id, { assignee_ids: [] });
            onUpdateData();
        } catch (error) {
            // Rollback on error
            setSelectedIds(previousIds);
            message.error(t2('ERROR_REMOVE_ASSIGNEES'));
        }
    };

    const getDueDateColor = (dueDate: string) => {
        const due = dayjs(dueDate);
        const now = dayjs();
        if (due.isBefore(now, 'day')) return 'red';
        if (due.isSame(now, 'day')) return 'orange';
        if (due.diff(now, 'day') <= 2) return 'gold';
        return 'default';
    };

    const menuItems = [
        {
            key: 'assign',
            icon: <UserOutlined />,
            label: t2('UI_ASSIGN_MEMBER'),
            onClick: () => {
                setMemberModalOpen(true);
            },
        },
        {
            key: 'duedate',
            icon: <CalendarOutlined />,
            label: t2('UI_SET_DUE_DATE'),
            onClick: () => {
                setDueDateModalOpen(true);
            },
        },
        { type: 'divider' as const },
        {
            key: 'convert',
            label: t2('UI_CONVERT_TO_CARD'),
            icon: <SwapOutlined />,
            onClick: onConvertToCard,
        },
        { type: 'divider' as const },
        {
            key: 'delete',
            label: t2('UI_DELETE'),
            danger: true,
            icon: <DeleteOutlined />,
            onClick: onDelete,
        },
    ];

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                padding: '8px 8px',
                borderRadius: 8,
                transition: 'background 0.2s',
                background: isHovered
                    ? (mode === 'dark' ? '#22272b' : '#ebecf0')
                    : 'transparent',
                cursor: 'default',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Checkbox
                checked={item.is_completed}
                onChange={onToggle}
            />

            {/* Content - left side */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                    <div>
                        <Input.TextArea
                            value={editingContent}
                            onChange={(e) => onEditContentChange(e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            autoFocus
                        />
                        <Space style={{ marginTop: 4 }}>
                            <Button type="primary" size="small" onClick={onSaveEdit}>
                                {t2('UI_SAVE')}
                            </Button>
                            <Button size="small" onClick={onCancelEdit}>
                                {t2('UI_CANCEL')}
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
                        onClick={onStartEdit}
                    >
                        {item.content}
                    </Text>
                )}
            </div>

            {/* Right side - Due date, Assignee, More menu */}
            {!isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Due Date */}
                    {item.due_date && (
                        <Tag
                            color={getDueDateColor(item.due_date)}
                            icon={<CalendarOutlined />}
                            style={{
                                cursor: 'pointer',
                                margin: 0,
                                borderRadius: 4,
                            }}
                            onClick={() => setDueDateModalOpen(true)}
                        >
                            {dayjs(item.due_date).format('MMM D')}
                        </Tag>
                    )}

                    {/* Assignee Avatars */}
                    {item.assignees && item.assignees.length > 0 && (
                        <div
                            style={{ cursor: 'pointer' }}
                            onClick={() => setMemberModalOpen(true)}
                        >
                            <div style={{ display: 'flex' }}>
                                {item.assignees.slice(0, 3).map(assignee => (
                                    <div key={assignee.id} style={{ marginLeft: -4 }}>
                                        <UserAvatar
                                            avatarUrl={assignee.user?.avatar_url}
                                            name={assignee.user?.full_name || assignee.user?.email}
                                            size={28}
                                        />
                                    </div>
                                ))}
                                {item.assignees.length > 3 && (
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        backgroundColor: token.colorPrimary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        color: token.colorWhite,
                                        marginLeft: -4,
                                    }}>
                                        +{item.assignees.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* More menu */}
                    <Dropdown
                        menu={{ items: menuItems }}
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

            {/* Due Date Modal */}
            <Modal
                title={t2('UI_SET_DUE_DATE')}
                open={dueDateModalOpen}
                onCancel={closeDueDateModal}
                footer={null}
                width={300}
                destroyOnHidden
            >
                <DueDatePickerContent
                    checklistId={checklistId}
                    item={item}
                    onUpdate={onUpdateData}
                    onClose={closeDueDateModal}
                />
            </Modal>

            {/* Assign Member Modal */}
            <MemberPickerModal
                open={memberModalOpen}
                onClose={closeMemberModal}
                workspaceMembers={workspaceMembers}
                selectedMemberIds={selectedIds}
                onToggleMember={handleToggleMember}
                onRemoveAll={handleRemoveAllAssignees}
            />
        </div>
    );
}
