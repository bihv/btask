'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workspace } from '@/types';
import api from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Stack, Button, Center, Loader, Badge, TextInput, Select, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCrown } from '@tabler/icons-react';
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
    const { user } = useAuthStore();
    const t = useTranslation();
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
            notifications.show({ message: t('SUCCESS_MEMBER_INVITED'), color: 'green' });
            setEmail('');
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace.id] });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_INVITE_MEMBER'), color: 'red' });
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (userId: string) => {
            return api.delete(`/workspaces/${workspace.id}/members/${userId}`);
        },
        onSuccess: () => {
            notifications.show({ message: t('SUCCESS_MEMBER_REMOVED'), color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace.id] });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_REMOVE_MEMBER'), color: 'red' });
        },
    });

    const handleInvite = () => {
        if (!email.trim()) {
            notifications.show({ message: t('WARN_ENTER_EMAIL'), color: 'yellow' });
            return;
        }
        inviteMutation.mutate({ email: email.trim(), role });
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title order={4} style={{ margin: 0 }}>{t('UI_WORKSPACE_MEMBERS')}</Title>
            </div>

            {isOwner && (
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>
                        {t('UI_INVITE_BY_EMAIL')}
                    </Text>
                    <Group wrap="nowrap" style={{ width: '100%' }}>
                        <TextInput
                            placeholder={t('UI_PLACEHOLDER_EMAIL')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                            style={{ flex: 1 }}
                        />
                        <Select
                            value={role}
                            onChange={(val) => setRole(val || 'member')}
                            style={{ width: 120 }}
                            data={[
                                { value: 'member', label: t('UI_MEMBER') },
                                { value: 'admin', label: t('UI_ADMIN') },
                            ]}
                        />
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleInvite}
                            loading={inviteMutation.isPending}
                        >
                            {t('UI_INVITE')}
                        </Button>
                    </Group>
                </div>
            )}

            {members.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">{t('UI_NO_MEMBERS_YET')}</Text>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {members.map((item) => (
                        <div
                            key={item.user_id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px solid var(--border-color, #f0f0f0)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <UserAvatar
                                    avatarUrl={item.user?.avatar_url}
                                    name={item.user?.full_name || item.user?.email}
                                    size={40}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Group>
                                        <Text fw={700}>{item.user?.full_name || item.user?.email || t('UI_UNKNOWN')}</Text>
                                        {item.role === 'owner' && (
                                            <Badge color="gold" leftSection={<IconCrown size={16} />}>{t('UI_OWNER')}</Badge>
                                        )}
                                        {item.role === 'admin' && (
                                            <Badge color="blue">{t('UI_ADMIN')}</Badge>
                                        )}
                                    </Group>
                                    <Text c="dimmed" style={{ fontSize: '12px' }}>{item.user?.email}</Text>
                                </div>
                            </div>

                            {isOwner && item.user_id !== user?.id && (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={() => removeMutation.mutate(item.user_id)}
                                    loading={removeMutation.isPending}
                                >
                                    {t('UI_REMOVE')}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
