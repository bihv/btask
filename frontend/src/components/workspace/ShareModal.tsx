'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, AutoComplete, Button, Typography, Spin, Select, App } from 'antd';
import { DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import UserAvatar from '@/components/common/UserAvatar';
import { useUserSuggest } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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
    const { message } = App.useApp();
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
            message.warning(t('WARN_ENTER_EMAIL'));
            return;
        }

        setIsInviting(true);
        try {
            await api.post(`${basePath}/invite`, {
                email: email.trim(),
                role
            });
            message.success(t('SUCCESS_MEMBER_INVITED'));
            setEmail('');
            fetchMembers();
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_INVITE_MEMBER'));
        }
        setIsInviting(false);
    };

    const handleRemove = async (userId: string) => {
        try {
            await api.delete(`${basePath}/members/${userId}`);
            message.success(t('SUCCESS_MEMBER_REMOVED'));
            fetchMembers();
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_REMOVE_MEMBER'));
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
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
        >
            {isOwner && (
                <div style={{ marginBottom: 24 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        {t('UI_INVITE_BY_EMAIL')}
                    </Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <AutoComplete
                            value={email}
                            options={options}
                            onSelect={handleSelect}
                            onChange={setEmail}
                            placeholder={t('UI_PLACEHOLDER_EMAIL_DOTS')}
                            style={{ flex: 1 }}
                            notFoundContent={isSearching ? <Spin size="small" /> : null}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleInvite();
                                }
                            }}
                            optionRender={(option) => {
                                const user = (option.data as any).user;
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
                            onChange={setRole}
                            style={{ width: 100 }}
                            options={[
                                { value: 'member', label: t('UI_MEMBER') },
                                { value: 'admin', label: t('UI_ADMIN') },
                            ]}
                        />
                        <Button
                            type="primary"
                            onClick={handleInvite}
                            loading={isInviting}
                        >
                            {t('UI_INVITE')}
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {t('UI_MEMBERS')} ({members.length})
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
