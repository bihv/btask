'use client';

import { useState } from 'react';
import { Typography, List, Button, Empty, Spin, App, Tag, Input, Select, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workspace } from '@/types';
import api from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

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

interface WorkspaceMembersProps {
    workspace: Workspace;
}

export default function WorkspaceMembers({ workspace }: WorkspaceMembersProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const { message } = App.useApp();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    
    const isOwner = workspace.owner_id === user?.id;

    const { data: members = [], isLoading } = useQuery<Member[]>({
        queryKey: ['workspace-members', workspace.id],
        queryFn: async () => {
            const response = await api.get(`/workspaces/${workspace.id}/members`);
            return response.data.data || [];
        },
        enabled: !!workspace.id,
    });

    const inviteMutation = useMutation({
        mutationFn: async ({ email, role }: { email: string; role: string }) => {
            return api.post(`/workspaces/${workspace.id}/invite`, { email, role });
        },
        onSuccess: () => {
            message.success('Member invited successfully');
            setEmail('');
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace.id] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to invite member');
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (userId: string) => {
            return api.delete(`/workspaces/${workspace.id}/members/${userId}`);
        },
        onSuccess: () => {
            message.success('Member removed');
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace.id] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to remove member');
        },
    });

    const handleInvite = () => {
        if (!email.trim()) {
            message.warning('Please enter an email');
            return;
        }
        inviteMutation.mutate({ email: email.trim(), role });
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Workspace Members</Title>
            </div>

            {isOwner && (
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Invite by email
                    </Text>
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onPressEnter={handleInvite}
                            style={{ flex: 1 }}
                        />
                        <Select
                            value={role}
                            onChange={setRole}
                            style={{ width: 120 }}
                            options={[
                                { value: 'member', label: 'Member' },
                                { value: 'admin', label: 'Admin' },
                            ]}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleInvite}
                            loading={inviteMutation.isPending}
                        >
                            Invite
                        </Button>
                    </Space.Compact>
                </div>
            )}

            {members.length === 0 ? (
                <Empty description="No members yet" />
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={members}
                    renderItem={(item) => (
                        <List.Item
                            actions={
                                isOwner && item.user_id !== user?.id
                                    ? [
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            key="remove"
                                            onClick={() => removeMutation.mutate(item.user_id)}
                                            loading={removeMutation.isPending}
                                        >
                                            Remove
                                        </Button>
                                    ]
                                    : []
                            }
                        >
                            <List.Item.Meta
                                avatar={
                                    <UserAvatar
                                        avatarUrl={item.user?.avatar_url}
                                        name={item.user?.full_name || item.user?.email}
                                        size={40}
                                    />
                                }
                                title={
                                    <Space>
                                        <Text strong>{item.user?.full_name || item.user?.email || 'Unknown'}</Text>
                                        {item.role === 'owner' && (
                                            <Tag color="gold" icon={<CrownOutlined />}>Owner</Tag>
                                        )}
                                        {item.role === 'admin' && (
                                            <Tag color="blue">Admin</Tag>
                                        )}
                                    </Space>
                                }
                                description={item.user?.email}
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
}
