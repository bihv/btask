'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useUserSuggest } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useLabels';

import { Modal, Autocomplete, Button, Text, Title, Loader, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconCrown } from '@tabler/icons-react';
interface Member {
    id: string;
    user_id: string;
    workspace_id?: string;
    board_id?: string;
    role: string;
    user?: {
        id: string;
        email: string;
        full_name: string;
        avatar_url?: string;
    };
}

type ShareType = 'workspace' | 'board';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    workspaceId?: string;
    boardId?: string;
    isOwner: boolean;
    type?: ShareType;
}

export default function ShareModal({
    open,
    onClose,
    workspaceId,
    boardId,
    isOwner,
    type = 'workspace'
}: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const t = useTranslation();

    const isBoard = type === 'board';
    const entityId = isBoard ? boardId : workspaceId;
    const basePath = isBoard ? `/boards/${boardId}` : `/workspaces/${workspaceId}`;
    const title = isBoard ? t('UI_SHARE_BOARD') : t('UI_SHARE_WORKSPACE');

    // Debounce search query
    const debouncedQuery = useDebounce(email, 300);

    // Use React Query for user suggestions
    const { data: suggestions = [], isFetching: isSearching } = useUserSuggest(debouncedQuery, open);

    // Get member user IDs to filter from suggestions
    const memberUserIds = useMemo(() =>
        new Set(members.map(m => m.user_id)),
        [members]
    );

    // Filter out existing members from suggestions
    const filteredSuggestions = useMemo(() =>
        suggestions.filter(u => !memberUserIds.has(u.id)),
        [suggestions, memberUserIds]
    );

    const fetchMembers = async () => {
        if (!entityId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`${basePath}/members`);
            setMembers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (open && entityId) {
            fetchMembers();
        }
    }, [open, entityId]);

    const handleSelect = (value: string) => {
        setEmail(value);
    };

    const handleInvite = async () => {
        if (!email.trim()) {
            notifications.show({ message: t('WARN_ENTER_EMAIL'), color: 'yellow' });
            return;
        }

        setIsInviting(true);
        try {
            await api.post(`${basePath}/invite`, {
                email: email.trim(),
                role
            });
            notifications.show({ message: t('SUCCESS_MEMBER_INVITED'), color: 'green' });
            setEmail('');
            fetchMembers();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_INVITE_MEMBER'), color: 'red' });
        }
        setIsInviting(false);
    };

    const handleRemove = async (userId: string) => {
        try {
            await api.delete(`${basePath}/members/${userId}`);
            notifications.show({ message: t('SUCCESS_MEMBER_REMOVED'), color: 'green' });
            fetchMembers();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_REMOVE_MEMBER'), color: 'red' });
        }
    };

    // Build autocomplete options - label is what shows in input after selection
    const options = filteredSuggestions.map(user => ({
        value: user.email,
        label: user.email,
        user,  // Store user data for optionRender
    }));

    return (
        <Modal
            title={title}
            opened={open}
            onClose={onClose}
            size={480}
        >
            {isOwner && (
                <div style={{ marginBottom: 24 }}>
                    <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>
                        {t('UI_INVITE_BY_EMAIL')}
                    </Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Autocomplete
                            value={email}
                            data={options}
                            onChange={(val) => {
                                setEmail(val);
                                handleSelect(val);
                            }}
                            placeholder={t('UI_PLACEHOLDER_EMAIL_DOTS')}
                            style={{ flex: 1 }}
                            rightSection={isSearching ? <Loader size="xs" /> : null}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleInvite();
                                }
                            }}
                            renderOption={({ option }) => {
                                const user = (option as any).user;
                                if (!user) return <Text>{(option as any).label || option.value}</Text>;
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                                        <UserAvatar
                                            avatarUrl={user.avatar_url}
                                            name={user.full_name || user.email}
                                            size={28}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13 }}>
                                                {user.full_name || user.email}
                                            </div>
                                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Select
                            value={role}
                            onChange={(val) => setRole(val || 'member')}
                            style={{ width: 100 }}
                            data={[
                                { value: 'member', label: t('UI_MEMBER') },
                                { value: 'admin', label: t('UI_ADMIN') },
                            ]}
                        />
                        <Button
                            onClick={handleInvite}
                            loading={isInviting}
                        >
                            {t('UI_INVITE')}
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>
                    {t('UI_MEMBERS')} ({members.length})
                </Text>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <Loader />
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
                                                <IconCrown size={16}
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
                                    <Text c="dimmed"
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
                                            variant="subtle"
                                            color="red"
                                            leftSection={<IconTrash size={16} />}
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
