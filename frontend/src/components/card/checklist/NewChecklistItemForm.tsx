'use client';

import React, { useState, useEffect } from 'react';
import {
    Input,
    Button,
    Space,
    Popover,
    DatePicker,
    Tag,
} from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { User } from '@/types';
import dayjs from 'dayjs';
import MemberPickerContent from '@/components/common/MemberPickerContent';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

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
            <DatePicker
                value={dueDate ? dayjs(dueDate) : null}
                onChange={(date) => onDueDateChange(date ? date.toISOString() : null)}
                style={{ width: '100%' }}
                placeholder={t('UI_SELECT_DUE_DATE')}
            />
            {dueDate && (
                <Button
                    size="small"
                    danger
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
            <Input.TextArea
                placeholder={t('UI_PLACEHOLDER_ADD_ITEM')}
                value={content}
                onChange={(e) => {
                    onContentChange(e.target.value);
                    if (e.target.value && !isActive) {
                        onFocus();
                    }
                }}
                onFocus={onFocus}
                onPressEnter={(e) => {
                    if (!e.shiftKey) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
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
                            <Tag
                                key={member.id}
                                closable
                                onClose={() => onAssigneeIdsChange(assigneeIds.filter(id => id !== assigneeId))}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <UserAvatar
                                    avatarUrl={member.avatar_url}
                                    name={member.full_name}
                                    size={14}
                                />
                                {member.full_name}
                            </Tag>
                        ) : null;
                    })}
                    {dueDate && (
                        <Tag
                            closable
                            onClose={() => onDueDateChange(null)}
                            icon={<CalendarOutlined />}
                            color="blue"
                        >
                            {dayjs(dueDate).format('MMM D')}
                        </Tag>
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
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={onSubmit}
                            disabled={!content.trim()}
                        >
                            {t('UI_ADD')}
                        </Button>
                        <Button size="small" onClick={onCancel}>
                            {t('UI_CANCEL')}
                        </Button>
                    </Space>
                    <Space>
                        <Popover
                            content={renderMemberPicker()}
                            trigger="click"
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<UserOutlined />}
                                style={{
                                    color: assigneeIds.length > 0 ? token.colorPrimary : undefined
                                }}
                            >
                                {t('UI_ASSIGN')}
                            </Button>
                        </Popover>
                        <Popover
                            content={renderDueDatePicker()}
                            trigger="click"
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<CalendarOutlined />}
                                style={{
                                    color: dueDate ? token.colorPrimary : undefined
                                }}
                            >
                                {t('UI_DUE_DATE_LABEL')}
                            </Button>
                        </Popover>
                    </Space>
                </div>
            )}
        </div>
    );
}
