'use client';

import React from 'react';
import { Modal, Typography, App } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { User, CardMember } from '@/types';
import UserAvatar from '@/components/common/UserAvatar';
import api from '@/lib/api';

const { Text } = Typography;

interface MembersPickerModalProps {
    open: boolean;
    onClose: () => void;
    cardId: string;
    cardMembers: CardMember[];
    workspaceMembers: User[];
    onUpdate: () => Promise<void> | void;
}

export default function MembersPickerModal({
    open,
    onClose,
    cardId,
    cardMembers,
    workspaceMembers,
    onUpdate,
}: MembersPickerModalProps) {
    const { message } = App.useApp();

    const handleToggleMember = async (userId: string) => {
        const hasMember = cardMembers?.some((cm) => cm.user_id === userId);

        try {
            if (hasMember) {
                await api.delete(`/cards/${cardId}/members/${userId}`);
            } else {
                await api.post(`/cards/${cardId}/members`, { user_id: userId });
            }
            await onUpdate();
        } catch (error) {
            message.error('Failed to update member');
        }
    };

    return (
        <Modal
            title="Members"
            open={open}
            onCancel={onClose}
            footer={null}
            width={320}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {workspaceMembers.map((member) => {
                    const isAssigned = cardMembers?.some((cm) => cm.user_id === member.id);
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
                            onClick={() => handleToggleMember(member.id)}
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
                            {isAssigned && <CheckOutlined style={{ color: '#52c41a' }} />}
                        </div>
                    );
                })}
                {workspaceMembers.length === 0 && (
                    <Text type="secondary" style={{ textAlign: 'center', padding: 16 }}>
                        No members in workspace
                    </Text>
                )}
            </div>
        </Modal>
    );
}
