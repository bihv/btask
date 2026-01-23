'use client';

import React from 'react';
import { Card, User, Checklist, Attachment, BoardList } from '@/types';
import DraggableCoverImage from './DraggableCoverImage';
import CardDescriptionSection from './CardDescriptionSection';
import ChecklistSection from './ChecklistSection';
import AttachmentSection from './AttachmentSection';

interface CardMainContentProps {
    card: Card;
    cardId: string;
    boardId: string;
    coverPosition: number;
    description: string;
    isEditingDesc: boolean;
    checklists: Checklist[];
    attachments: Attachment[];
    workspaceMembers: User[];
    lists: BoardList[];
    onCoverPositionChange: (value: number) => void;
    onCoverPositionSave: (value: number) => Promise<void>;
    onDescriptionChange: (value: string) => void;
    onDescriptionSave: () => void;
    onDescriptionCancel: () => void;
    onDescriptionEditStart: () => void;
    onChecklistUpdate: () => void;
    onAttachmentUpdate: () => void;
    onCoverChange: (url: string) => void;
}

export default function CardMainContent({
    card,
    cardId,
    boardId,
    coverPosition,
    description,
    isEditingDesc,
    checklists,
    attachments,
    workspaceMembers,
    lists,
    onCoverPositionChange,
    onCoverPositionSave,
    onDescriptionChange,
    onDescriptionSave,
    onDescriptionCancel,
    onDescriptionEditStart,
    onChecklistUpdate,
    onAttachmentUpdate,
    onCoverChange,
}: CardMainContentProps) {
    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                overflowY: 'auto',
                padding: 24,
            }}
        >
            {card.cover_image && (
                <div
                    style={{
                        margin: '-24px -24px 24px -24px',
                        width: 'calc(100% + 48px)',
                    }}
                >
                    <DraggableCoverImage
                        imageUrl={card.cover_image}
                        position={coverPosition}
                        onPositionChange={onCoverPositionChange}
                        onPositionChangeComplete={onCoverPositionSave}
                    />
                </div>
            )}

            {/* Description */}
            <CardDescriptionSection
                description={description}
                isEditing={isEditingDesc}
                onDescriptionChange={onDescriptionChange}
                onSave={onDescriptionSave}
                onCancel={onDescriptionCancel}
                onEditStart={onDescriptionEditStart}
            />

            {/* Checklists */}
            <div style={{ marginTop: 24 }}>
                <ChecklistSection
                    cardId={cardId}
                    boardId={boardId}
                    checklists={checklists}
                    onUpdate={onChecklistUpdate}
                    workspaceMembers={workspaceMembers}
                    lists={lists}
                />
            </div>

            {/* Attachments */}
            <div style={{ marginTop: 24 }}>
                <AttachmentSection
                    cardId={cardId}
                    attachments={attachments}
                    onUpdate={onAttachmentUpdate}
                    currentCover={card?.cover_image}
                    onSetCover={onCoverChange}
                />
            </div>
        </div>
    );
}
