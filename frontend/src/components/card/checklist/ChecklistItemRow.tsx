'use client';

import React, { useState, useEffect } from 'react';
import { ChecklistItem as ChecklistItemType, User } from '@/types';
import dayjs from 'dayjs';
import MemberPickerModal from '@/components/common/MemberPickerModal';
import { checklistApi } from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Text, Title, Checkbox, TextInput, Button, Group, Menu, Badge, Modal, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconUser, IconCalendar, IconArrowsExchange, IconTrash, IconDots } from '@tabler/icons-react';
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
    const t = useTranslation();
    const handleDateChange = async (date: any) => {
        try {
            await checklistApi.updateItem(checklistId, item.id, {
                due_date: date ? new Date(date).toISOString() : null
            });
            onUpdate();
            // Use setTimeout to ensure state update completes before closing
            setTimeout(() => {
                onClose();
            }, 0);
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_DUE_DATE'), color: 'red' });
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
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_DUE_DATE'), color: 'red' });
        }
    };

    return (
        <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('UI_DUE_DATE_LABEL')}</div>
            <DatePickerInput
                value={item.due_date ? new Date(item.due_date) : null}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                placeholder={t('UI_SELECT_DUE_DATE')}
            />
            {item.due_date && (
                <Button
                    size="sm"
                    color="red"
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
            notifications.show({ title: 'Error', message: t2('ERROR_UPDATE_ASSIGNEES'), color: 'red' });
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
            notifications.show({ title: 'Error', message: t2('ERROR_REMOVE_ASSIGNEES'), color: 'red' });
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
                        <Textarea
                            value={editingContent}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onEditContentChange(e.target.value)}
                            autosize
                            minRows={1}
                            maxRows={4}
                            autoFocus
                        />
                        <Group style={{ marginTop: 4 }}>
                            <Button size="sm" onClick={onSaveEdit}>
                                {t2('UI_SAVE')}
                            </Button>
                            <Button size="sm" onClick={onCancelEdit}>
                                {t2('UI_CANCEL')}
                            </Button>
                        </Group>
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
                        <Badge
                            color={getDueDateColor(item.due_date)}
                            leftSection={<IconCalendar size={16} />}
                            style={{
                                cursor: 'pointer',
                                margin: 0,
                                borderRadius: 4,
                            }}
                            onClick={() => setDueDateModalOpen(true)}
                        >
                            {dayjs(item.due_date).format('MMM D')}
                        </Badge>
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
                    <Menu trigger="click" position="bottom-end">
                        <Menu.Target>
                            <Button
                                variant="subtle"
                                size="sm"
                                leftSection={<IconDots size={16} />}
                                style={{ opacity: 0.6 }}
                            />
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<IconUser size={16} />} onClick={() => setMemberModalOpen(true)}>
                                {t2('UI_ASSIGN_MEMBER')}
                            </Menu.Item>
                            <Menu.Item leftSection={<IconCalendar size={16} />} onClick={() => setDueDateModalOpen(true)}>
                                {t2('UI_SET_DUE_DATE')}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item leftSection={<IconArrowsExchange size={16} />} onClick={onConvertToCard}>
                                {t2('UI_CONVERT_TO_CARD')}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => {
                                modals.openConfirmModal({
                                    title: t2('UI_CONFIRM_DELETE'),
                                    centered: true,
                                    children: (
                                        <Text size="sm">
                                            {t2('UI_CONFIRM_DELETE_CHECKLIST_ITEM_MSG')}
                                        </Text>
                                    ),
                                    labels: { confirm: t2('UI_DELETE'), cancel: t2('UI_CANCEL') },
                                    confirmProps: { color: 'red' },
                                    onConfirm: onDelete,
                                });
                            }}>
                                {t2('UI_DELETE')}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>
            )}

            {/* Due Date Modal */}
            <Modal
                title={t2('UI_SET_DUE_DATE')}
                opened={dueDateModalOpen}
                onClose={closeDueDateModal}
                size={300}
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
