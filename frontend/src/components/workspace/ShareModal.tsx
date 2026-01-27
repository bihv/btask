'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Spin, Select, App } from 'antd';
import { UserAddOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';

const { Text } = Typography;

interface Member {
    id: string;
    user_id: string;
    workspace_id: string;
    role: string;
    user?: {
        id: string;
        email: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    workspaceId: string;
    isOwner: boolean;
}

export default function ShareModal({ open, onClose, workspaceId, isOwner }: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const { message } = App.useApp();

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/workspaces/${workspaceId}/members`);
            setMembers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (open && workspaceId) {
            fetchMembers();
        }
    }, [open, workspaceId]);

    const handleInvite = async () => {
        if (!email.trim()) {
            message.warning('Please enter an email');
            return;
        }

        setIsInviting(true);
        try {
            await api.post(`/workspaces/${workspaceId}/invite`, {
                email: email.trim(),
                role
            });
            setEmail('');
            fetchMembers();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to invite member');
        }
        setIsInviting(false);
    };

    const handleRemove = async (userId: string) => {
        try {
            await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
            fetchMembers();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to remove member');
        }
    };


    return (
        <Modal
            title="Share Workspace"
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
        >
            {isOwner && (
                <div style={{ marginBottom: 24 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Invite by email
                    </Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input
                            placeholder="Enter email address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onPressEnter={handleInvite}
                            prefix={<UserAddOutlined />}
                            style={{ flex: 1 }}
                        />
                        <Select
                            value={role}
                            onChange={setRole}
                            style={{ width: 100 }}
                            options={[
                                { value: 'member', label: 'Member' },
                                { value: 'admin', label: 'Admin' },
                            ]}
                        />
                        <Button
                            type="primary"
                            onClick={handleInvite}
                            loading={isInviting}
                        >
                            Invite
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Members ({members.length})
                </Text>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <Spin />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {members.map((member, index) => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: index < members.length - 1 ? '1px solid #f0f0f0' : 'none',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flex: 1,
                                        minWidth: 0,
                                        marginRight: 16,
                                    }}
                                >
                                    <div style={{ marginRight: 16, flexShrink: 0 }}>
                                        <UserAvatar
                                            avatarUrl={member.user?.avatar_url}
                                            name={member.user?.full_name || member.user?.email}
                                            size={32}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 500 }}>
                                            {member.user?.full_name || member.user?.email}
                                            {member.role === 'owner' && (
                                                <CrownOutlined
                                                    style={{ marginLeft: 8, color: '#faad14' }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ fontSize: 14 }}>
                                            {member.user?.email}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            textTransform: 'capitalize',
                                            marginRight: isOwner && member.role !== 'owner' ? 16 : 0,
                                        }}
                                    >
                                        {member.role}
                                    </Text>
                                    {isOwner && member.role !== 'owner' && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemove(member.user_id)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
