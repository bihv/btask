import React from 'react';
import { Label, User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';
import dayjs from 'dayjs';

import { Popover, TextInput, Button, Checkbox, Avatar, Badge, Group, Divider, Text, Title } from '@mantine/core';
import { IconFilter, IconSearch, IconUser, IconClock, IconTag } from '@tabler/icons-react';
export interface FilterState {
    search: string;
    labelIds: string[];
    noLabels: boolean;
    memberIds: string[];
    noMembers: boolean;
    dueDate: 'overdue' | 'due_soon' | 'due_later' | 'no_date' | null;
}

export const defaultFilters: FilterState = {
    search: '',
    labelIds: [],
    noLabels: false,
    memberIds: [],
    noMembers: false,
    dueDate: null,
};

export function hasActiveFilters(filters: FilterState): boolean {
    return (
        filters.search !== '' ||
        filters.labelIds.length > 0 ||
        filters.noLabels ||
        filters.memberIds.length > 0 ||
        filters.noMembers ||
        filters.dueDate !== null
    );
}

interface BoardFilterPopoverProps {
    labels: Label[];
    members: User[];
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    hideNoDateOption?: boolean;
    children: React.ReactNode;
}

export default function BoardFilterPopover({
    labels,
    members,
    filters,
    onChange,
    hideNoDateOption,
    children,
}: BoardFilterPopoverProps) {
    const t = useTranslation();
    const token = useAppToken();
    const activeCount = [
        filters.search ? 1 : 0,
        (filters.labelIds.length > 0 || filters.noLabels) ? 1 : 0,
        (filters.memberIds.length > 0 || filters.noMembers) ? 1 : 0,
        filters.dueDate ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const handleLabelToggle = (labelId: string) => {
        const newLabelIds = filters.labelIds.includes(labelId)
            ? filters.labelIds.filter((id) => id !== labelId)
            : [...filters.labelIds, labelId];
        onChange({ ...filters, labelIds: newLabelIds });
    };

    const handleMemberToggle = (memberId: string) => {
        const newMemberIds = filters.memberIds.includes(memberId)
            ? filters.memberIds.filter((id) => id !== memberId)
            : [...filters.memberIds, memberId];
        onChange({ ...filters, memberIds: newMemberIds });
    };

    const handleDueDateToggle = (option: FilterState['dueDate']) => {
        const newValue = filters.dueDate === option ? null : option;
        onChange({ ...filters, dueDate: newValue });
    };

    const content = (
        <div style={{ width: 300, maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text fw={700} style={{ fontSize: 14 }}>{t('UI_FILTER_CARDS')}</Text>
                    {activeCount > 0 && (
                        <Button
                            size="sm"
                            variant="transparent"
                            color="red"
                            onClick={() => onChange(defaultFilters)}
                            style={{ padding: 0 }}
                        >
                            {t('UI_CLEAR_FILTERS')}
                        </Button>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text c="dimmed" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('UI_KEYWORDS')}</Text>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_SEARCH_CARDS')}
                        leftSection={<IconSearch size={16} style={{ color: 'var(--text-secondary)' }} />}
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}

                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text c="dimmed" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('UI_MEMBERS')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => onChange({ ...filters, noMembers: !filters.noMembers })}
                        >
                            <Checkbox checked={filters.noMembers} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar size="sm" />
                                <Text>{t('UI_NO_MEMBERS')}</Text>
                            </div>
                        </div>
                        {members.map(member => (
                            <div
                                key={member.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleMemberToggle(member.id)}
                            >
                                <Checkbox checked={filters.memberIds.includes(member.id)} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <UserAvatar size="small" avatarUrl={member.avatar_url} name={member.full_name || member.email} />
                                    <Text>{member.full_name || member.email}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text c="dimmed" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('UI_LABELS_SECTION')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => onChange({ ...filters, noLabels: !filters.noLabels })}
                        >
                            <Checkbox checked={filters.noLabels} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconTag size={16} />
                                <Text>{t('UI_NO_LABELS')}</Text>
                            </div>
                        </div>
                        {labels.map(label => (
                            <div
                                key={label.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleLabelToggle(label.id)}
                            >
                                <Checkbox checked={filters.labelIds.includes(label.id)} />
                                <div style={{
                                    width: '100%',
                                    height: 32,
                                    backgroundColor: label.color,
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: 12
                                }}>
                                    <Text style={{ color: token.colorWhite, fontWeight: 500, textShadow: `0 1px 2px ${token.colorShadowHeavy}` }}>
                                        {label.name}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    <Text c="dimmed" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('UI_DUE_DATE')}</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => handleDueDateToggle(null)}
                        >
                            <Checkbox checked={filters.dueDate === null} />
                            <Text>{t('UI_NO_FILTER')}</Text>
                        </div>
                        <div
                            key="overdue"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => handleDueDateToggle('overdue')}
                        >
                            <Checkbox checked={filters.dueDate === 'overdue'} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconClock size={16} style={{ color: token.colorOverdue }} />
                                <Text>{t('UI_OVERDUE')}</Text>
                            </div>
                        </div>
                        <div
                            key="due_soon"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => handleDueDateToggle('due_soon')}
                        >
                            <Checkbox checked={filters.dueDate === 'due_soon'} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconClock size={16} style={{ color: token.colorDueSoon }} />
                                <Text>{t('UI_DUE_SOON')}</Text>
                            </div>
                        </div>
                        <div
                            key="due_later"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => handleDueDateToggle('due_later')}
                        >
                            <Checkbox checked={filters.dueDate === 'due_later'} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconClock size={16} style={{ color: token.colorDueComplete }} />
                                <Text>{t('UI_DUE_LATER')}</Text>
                            </div>
                        </div>
                        {!hideNoDateOption && (
                            <div
                                key="no_date"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleDueDateToggle('no_date')}
                            >
                                <Checkbox checked={filters.dueDate === 'no_date'} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, border: `2px dashed ${token.colorMutedTextLight}`, borderRadius: '50%' }} />
                                    <Text>{t('UI_NO_DUE_DATE')}</Text>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Popover position="bottom-end" shadow="md">
            <Popover.Target>
                {children}
            </Popover.Target>
            <Popover.Dropdown style={{ padding: 16 }}>
                {content}
            </Popover.Dropdown>
        </Popover>
    );
}
