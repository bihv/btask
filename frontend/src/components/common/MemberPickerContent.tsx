'use client';

import React from 'react';
import { Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import { useAppToken } from '@/hooks/useAppToken';

interface MemberPickerContentProps {
    workspaceMembers: User[];
    selectedMemberIds: string[];
    onToggleMember: (userId: string) => void;
    onRemoveAll: () => void;
}

export default function MemberPickerContent({
    workspaceMembers,
    selectedMemberIds,
    onToggleMember,
    onRemoveAll,
}: MemberPickerContentProps) {
    const token = useAppToken();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
            {/* Remove all button */}
            {selectedMemberIds.length > 0 && (
                <div
                    onClick={onRemoveAll}
                    style={{
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        marginBottom: 8,
                        color: token.colorError,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <IconX size={12} />
                    Remove all ({selectedMemberIds.length})
                </div>
            )}

            {/* Member list */}
            {workspaceMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                    <div
                        key={member.id}
                        style={{
                            cursor: 'pointer',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            borderRadius: 6,
                            transition: 'background 0.2s',
                        }}
                        onClick={() => onToggleMember(member.id)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <UserAvatar
                            avatarUrl={member.avatar_url}
                            name={member.full_name}
                            size="small"
                        />
                        <span style={{ flex: 1 }}>{member.full_name}</span>
                        {isSelected && <IconCheck size={16} color={token.colorSuccess} />}
                    </div>
                );
            })}

            {workspaceMembers.length === 0 && (
                <Text c="dimmed" ta="center" p="md">
                    No members in workspace
                </Text>
            )}
        </div>
    );
}
