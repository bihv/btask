'use client';

import React from 'react';
import { Modal } from '@mantine/core';
import { User } from '@/types';
import MemberPickerContent from './MemberPickerContent';
import { useTranslation } from '@/hooks/useLabels';

interface MemberPickerModalProps {
    open: boolean;
    onClose: () => void;
    workspaceMembers: User[];
    selectedMemberIds: string[];
    onToggleMember: (userId: string) => void;
    onRemoveAll: () => void;
}

export default function MemberPickerModal({
    open,
    onClose,
    workspaceMembers,
    selectedMemberIds,
    onToggleMember,
    onRemoveAll,
}: MemberPickerModalProps) {
    const t = useTranslation();
    return (
        <Modal
            title={t('UI_MEMBERS')}
            opened={open}
            onClose={onClose}
            size={320}
        >
            <MemberPickerContent
                workspaceMembers={workspaceMembers}
                selectedMemberIds={selectedMemberIds}
                onToggleMember={onToggleMember}
                onRemoveAll={onRemoveAll}
            />
        </Modal>
    );
}
