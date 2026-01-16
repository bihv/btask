'use client';

import React from 'react';
import { CheckSquareOutlined, CloseOutlined } from '@ant-design/icons';
import { User } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';

interface MemberPickerProps {
    selectedIds: string[];
    workspaceMembers: User[];
    onToggle: (userId: string) => void;
    onRemoveAll: () => void;
    mode: 'dark' | 'light';
}


export default function MemberPicker({
    selectedIds,
    workspaceMembers,
    onToggle,
    onRemoveAll,
    mode,
}: MemberPickerProps) {
    return (
        <div style={{ width: '100%' }}>
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
                        <UserAvatar
                            avatarUrl={member.avatar_url}
                            name={member.full_name || member.email}
                            size={24}
                        />
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
}
