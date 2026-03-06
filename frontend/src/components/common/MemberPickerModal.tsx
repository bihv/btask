'use client';

import { useTranslation } from '@/hooks/useLabels';
import { User } from '@/types';
import { Modal } from '@mantine/core';
import MemberPickerContent from './MemberPickerContent';

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
