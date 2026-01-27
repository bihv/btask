'use client';

import React from 'react';
import { Modal } from 'antd';
import { User } from '@/types';
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
    return (
        <Modal
            title="Members"
            open={open}
            onCancel={onClose}
            footer={null}
            width={320}
            destroyOnHidden
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
