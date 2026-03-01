'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Card, User, Checklist, Attachment, BoardList } from '@/types';
import CardDescriptionSection from './CardDescriptionSection';
import ChecklistSection from './ChecklistSection';
import AttachmentSection from './AttachmentSection';
import ShareCardModal from './ShareCardModal';
import UserAvatar from '@/components/common/UserAvatar';
import DueDateTag from '@/components/common/DueDateTag';
import { useBoardStore } from '@/stores/boardStore';
import { cardArchiveApi } from '@/lib/api';
import { CardBackSectionRenderer, CardButtonRenderer } from '@/components/plugins';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Button, Text, Title, Tooltip, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTag, IconClock, IconCheckbox, IconUser, IconPaperclip, IconPhoto, IconTrash, IconInbox, IconArrowBack } from '@tabler/icons-react';
interface CardMainContentProps {
    card: Card;
    cardId: string;
    boardId: string;
    description: string;
    isEditingDesc: boolean;
    checklists: Checklist[];
    attachments: Attachment[];
    workspaceMembers: User[];
    workspaceId?: string;
    lists: BoardList[];
    onDescriptionChange: (value: string) => void;
    onDescriptionSave: () => void;
    onDescriptionCancel: () => void;
    onDescriptionEditStart: () => void;
    onChecklistUpdate: () => void;
    onAttachmentUpdate: () => void;
    onCoverChange: (url: string) => void;
    onMembersClick?: () => void;
    onLabelsClick?: () => void;
    onDueDateClick?: () => void;
    triggerAddChecklist?: boolean;
    onAddChecklistTriggered?: () => void;
    attachmentButtonRef?: React.RefObject<HTMLElement | null>;
    onCoverClick?: () => void;
    isArchived: boolean;
    onArchiveChange: (isArchived: boolean) => void;
    onPrint?: () => void;
}

export default function CardMainContent({
    card,
    cardId,
    boardId,
    description,
    isEditingDesc,
    checklists,
    attachments,
    workspaceMembers,
    workspaceId,
    lists,
    onDescriptionChange,
    onDescriptionSave,
    onDescriptionCancel,
    onDescriptionEditStart,
    onChecklistUpdate,
    onAttachmentUpdate,
    onCoverChange,
    onMembersClick,
    onLabelsClick,
    onDueDateClick,
    triggerAddChecklist,
    onAddChecklistTriggered,
    attachmentButtonRef,
    onCoverClick,
    isArchived,
    onArchiveChange,
    onPrint,
}: CardMainContentProps) {
    const router = useRouter();
    const { deleteCard } = useBoardStore();
    const t = useTranslation();
    const token = useAppToken();

    const handleArchive = async () => {
        try {
            if (isArchived) {
                await cardArchiveApi.unarchive(cardId);
                onArchiveChange(false);
            } else {
                await cardArchiveApi.archive(cardId);
                onArchiveChange(true);
            }
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_CARD'), color: 'red' });
        }
    };

    const handleDelete = () => {
        deleteCard(cardId);
        router.push(`/boards/${boardId}`);
    };

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                padding: 24,
                paddingTop: 8,
                overflowY: 'auto',
            }}
            className="card-main-content"
        >
            <style jsx>{`
                @media (max-width: 768px) {
                    .card-main-content {
                        overflow-y: visible !important;
                        height: auto !important;
                    }
                }
            `}</style>

            {/* Data Display Sections - Show when data exists */}
            {(card.members?.length || card.labels?.length || card.due_date || card.start_date) && (
                <div style={{ marginTop: 16, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Members Section */}
                        {card.members && card.members.length > 0 && (
                            <div>
                                <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    {t('UI_MEMBERS')}
                                </Text>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                                    onClick={onMembersClick}
                                >
                                    {card.members.map((cm) => (
                                        <Tooltip key={cm.id} label={cm.user?.full_name}>
                                            <div>
                                                <UserAvatar
                                                    avatarUrl={cm.user?.avatar_url}
                                                    name={cm.user?.full_name}
                                                    size="small"
                                                />
                                            </div>
                                        </Tooltip>
                                    ))}
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        leftSection={<span style={{ fontSize: 16 }}>+</span>}
                                        style={{ width: 32, height: 32, padding: 0 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Labels Section */}
                        {card.labels && card.labels.length > 0 && (
                            <div>
                                <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    {t('UI_LABELS')}
                                </Text>
                                <div
                                    style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={onLabelsClick}
                                >
                                    {card.labels.map((cl) => (
                                        <div
                                            key={cl.id}
                                            style={{
                                                backgroundColor: cl.label?.color,
                                                padding: '4px 12px',
                                                borderRadius: 4,
                                                color: token.colorWhite,
                                                fontSize: 12,
                                                height: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {cl.label?.name || ''}
                                        </div>
                                    ))}
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        leftSection={<span style={{ fontSize: 16 }}>+</span>}
                                        style={{ width: 32, height: 32, padding: 0 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Dates Section */}
                        {(card.start_date || card.due_date) && (
                            <div>
                                <Text c="dimmed" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    {t('UI_DATES')}
                                </Text>
                                <div
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                    onClick={onDueDateClick}
                                >
                                    {card.start_date && (
                                        <Badge>
                                            {dayjs(card.start_date).format('MMM D YYYY hh:mm A')}
                                        </Badge>
                                    )}
                                    {card.start_date && card.due_date && (
                                        <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                    )}
                                    {card.due_date && (
                                        <DueDateTag
                                            dueDate={card.due_date}
                                            isCompleted={card.is_completed || false}
                                            showIcon={false}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, marginTop: 16, flexWrap: 'wrap' }}>
                {/* Show Members button only when no members */}
                {(!card.members || card.members.length === 0) && (
                    <Button
                        leftSection={<IconUser size={16} />}
                        size="sm"
                        onClick={onMembersClick}
                    >
                        {t('UI_MEMBERS')}
                    </Button>
                )}
                {/* Show Labels button only when no labels */}
                {(!card.labels || card.labels.length === 0) && (
                    <Button
                        leftSection={<IconTag size={16} />}
                        size="sm"
                        onClick={onLabelsClick}
                    >
                        {t('UI_LABELS')}
                    </Button>
                )}
                {/* Show Dates button only when no dates at all */}
                {!card.due_date && !card.start_date && (
                    <Button
                        leftSection={<IconClock size={16} />}
                        size="sm"
                        onClick={onDueDateClick}
                    >
                        {t('UI_DATES')}
                    </Button>
                )}
                {/* Show Cover button when not a link card */}
                {!card.link_url && (
                    <Button
                        leftSection={<IconPhoto size={16} />}
                        size="sm"
                        onClick={onCoverClick}
                    >
                        {t('UI_COVER')}
                    </Button>
                )}
                <Button
                    leftSection={<IconCheckbox size={16} />}
                    size="sm"
                    onClick={onAddChecklistTriggered}
                >
                    {t('UI_CHECKLIST')}
                </Button>
                <Button
                    leftSection={<IconPaperclip size={16} />}
                    size="sm"
                    onClick={() => attachmentButtonRef?.current?.click()}
                >
                    {t('UI_ATTACHMENT')}
                </Button>
                <ShareCardModal
                    cardId={cardId}
                    cardTitle={card?.title || ''}
                    boardId={boardId}
                    cardData={card}
                    onPrint={onPrint}
                />
                <Button
                    leftSection={isArchived ? <IconArrowBack size={16} /> : <IconInbox size={16} />}
                    size="sm"
                    onClick={handleArchive}
                >
                    {isArchived ? t('UI_RESTORE') : t('UI_ARCHIVE')}
                </Button>
                <Button
                    leftSection={<IconTrash size={16} />}
                    size="sm"
                    color="red"
                    onClick={handleDelete}
                >
                    {t('UI_DELETE')}
                </Button>

                {/* Plugin Buttons */}
                <CardButtonRenderer card={card} />

            </div>

            {/* Description */}
            <CardDescriptionSection
                description={description}
                isEditing={isEditingDesc}
                onDescriptionChange={onDescriptionChange}
                onSave={onDescriptionSave}
                onCancel={onDescriptionCancel}
                onEditStart={onDescriptionEditStart}
                workspaceId={workspaceId}
                cardId={cardId}
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
                    triggerAddChecklist={triggerAddChecklist}
                    onAddChecklistTriggered={onAddChecklistTriggered}
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
                    buttonRef={attachmentButtonRef}
                />
            </div>

            {/* Plugin Sections */}
            <CardBackSectionRenderer card={card} />
        </div>
    );
}
