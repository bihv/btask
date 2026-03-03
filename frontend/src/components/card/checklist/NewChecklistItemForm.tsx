'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import dayjs from 'dayjs';
import MemberPickerContent from '@/components/common/MemberPickerContent';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { TextInput, Button, Group, Popover, Badge, Textarea, CloseButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUser, IconCalendar } from '@tabler/icons-react';
interface NewChecklistItemFormProps {
    checklistId: string;
    mode: 'dark' | 'light';
    workspaceMembers: User[];
    isActive: boolean;
    content: string;
    assigneeIds: string[];
    dueDate: string | null;
    onContentChange: (content: string) => void;
    onAssigneeIdsChange: (ids: string[]) => void;
    onDueDateChange: (date: string | null) => void;
    onFocus: () => void;
    onSubmit: () => void;
    onCancel: () => void;
}

export default function NewChecklistItemForm({
    checklistId,
    mode,
    workspaceMembers,
    isActive,
    content,
    assigneeIds,
    dueDate,
    onContentChange,
    onAssigneeIdsChange,
    onDueDateChange,
    onFocus,
    onSubmit,
    onCancel,
}: NewChecklistItemFormProps) {
    const [localAssigneeIds, setLocalAssigneeIds] = useState<string[]>(assigneeIds);
    const t = useTranslation();
    const token = useAppToken();

    useEffect(() => {
        setLocalAssigneeIds(assigneeIds);
    }, [assigneeIds]);

    const handleMemberToggle = (userId: string) => {
        const isAssigned = localAssigneeIds.includes(userId);
        const newIds = isAssigned
            ? localAssigneeIds.filter(id => id !== userId)
            : [...localAssigneeIds, userId];
        setLocalAssigneeIds(newIds);
        onAssigneeIdsChange(newIds);
    };

    const handleRemoveAllMembers = () => {
        setLocalAssigneeIds([]);
        onAssigneeIdsChange([]);
    };

    const renderMemberPicker = () => (
        <MemberPickerContent
            selectedMemberIds={localAssigneeIds}
            workspaceMembers={workspaceMembers}
            onToggleMember={handleMemberToggle}
            onRemoveAll={handleRemoveAllMembers}
        />
    );

    const renderDueDatePicker = () => (
        <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('UI_DUE_DATE_LABEL')}</div>
            <DatePickerInput
                value={dueDate ? new Date(dueDate) : null}
                onChange={(date: any) => onDueDateChange(date ? new Date(date).toISOString() : null)}
                style={{ width: '100%' }}
                placeholder={t('UI_SELECT_DUE_DATE')}
            />
            {dueDate && (
                <Button
                    size="sm"
                    color="red"
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={() => onDueDateChange(null)}
                >
                    {t('UI_REMOVE_DUE_DATE')}
                </Button>
            )}
        </div>
    );

    return (
        <div style={{ marginTop: 8 }}>
            <Textarea
                placeholder={t('UI_PLACEHOLDER_ADD_ITEM')}
                value={content}
                onChange={(e) => {
                    onContentChange(e.target.value);
                    if (e.target.value && !isActive) {
                        onFocus();
                    }
                }}
                onFocus={onFocus}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                minRows={1}
                maxRows={4}
                style={{
                    resize: 'vertical',
                    borderColor: isActive ? token.colorPrimary : undefined,
                }}
            />

            {/* Selected assignees & due date badges */}
            {isActive && (assigneeIds.length > 0 || dueDate) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {assigneeIds.map(assigneeId => {
                        const member = workspaceMembers.find(m => m.id === assigneeId);
                        return member ? (
                            <Badge
                                key={member.id}
                                rightSection={
                                    <CloseButton
                                        size="xs"
                                        variant="transparent"
                                        onClick={() => onAssigneeIdsChange(assigneeIds.filter(id => id !== assigneeId))}
                                    />
                                }
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <UserAvatar
                                    avatarUrl={member.avatar_url}
                                    name={member.full_name}
                                    size={14}
                                />
                                {member.full_name}
                            </Badge>
                        ) : null;
                    })}
                    {dueDate && (
                        <Badge
                            rightSection={
                                <CloseButton
                                    size="xs"
                                    variant="transparent"
                                    onClick={() => onDueDateChange(null)}
                                />
                            }
                            leftSection={<IconCalendar size={16} />}
                            color="blue"
                        >
                            {dayjs(dueDate).format('MMM D')}
                        </Badge>
                    )}
                </div>
            )}

            {/* Action buttons row */}
            {isActive && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                    justifyContent: 'space-between'
                }}>
                    <Group>
                        <Button variant="subtle" size="sm" onClick={onCancel}>
                            {t('UI_CANCEL')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={onSubmit}
                            disabled={!content.trim()}
                        >
                            {t('UI_ADD')}
                        </Button>
                    </Group>
                    <Group>
                        <Popover position="bottom-end">
                            <Popover.Target>
                                <Button
                                    variant="subtle"
                                    size="sm"
                                    leftSection={<IconUser size={16} />}
                                    style={{
                                        color: assigneeIds.length > 0 ? token.colorPrimary : undefined
                                    }}
                                >
                                    {t('UI_ASSIGN')}
                                </Button>
                            </Popover.Target>
                            <Popover.Dropdown p={0}>
                                {renderMemberPicker()}
                            </Popover.Dropdown>
                        </Popover>
                        <Popover position="bottom-end">
                            <Popover.Target>
                                <Button
                                    variant="subtle"
                                    size="sm"
                                    leftSection={<IconCalendar size={16} />}
                                    style={{
                                        color: dueDate ? token.colorPrimary : undefined
                                    }}
                                >
                                    {t('UI_DUE_DATE_LABEL')}
                                </Button>
                            </Popover.Target>
                            <Popover.Dropdown p={0}>
                                {renderDueDatePicker()}
                            </Popover.Dropdown>
                        </Popover>
                    </Group>
                </div>
            )}
        </div>
    );
}
