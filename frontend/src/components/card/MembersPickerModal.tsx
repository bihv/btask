'use client';

import React from 'react';
import { User, CardMember } from '@/types';
import MemberPickerModal from '@/components/common/MemberPickerModal';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useLabels';

import { notifications } from '@mantine/notifications';
interface CardMembersPickerModalProps {
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
}: CardMembersPickerModalProps) {
        const t = useTranslation();

    const selectedMemberIds = cardMembers?.map((cm) => cm.user_id) || [];

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
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_MEMBER'), color: 'red' });
        }
    };

    const handleRemoveAll = async () => {
        try {
            // Remove all members one by one
            await Promise.all(
                cardMembers.map((cm) =>
                    api.delete(`/cards/${cardId}/members/${cm.user_id}`)
                )
            );
            await onUpdate();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_REMOVE_MEMBERS'), color: 'red' });
        }
    };

    return (
        <MemberPickerModal
            open={open}
            onClose={onClose}
            workspaceMembers={workspaceMembers}
            selectedMemberIds={selectedMemberIds}
            onToggleMember={handleToggleMember}
            onRemoveAll={handleRemoveAll}
        />
    );
}
