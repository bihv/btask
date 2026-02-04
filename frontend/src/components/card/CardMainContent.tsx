'use client';

import React from 'react';
import { Button, Typography, Tooltip, App } from 'antd';
import { TagOutlined, ClockCircleOutlined, CheckSquareOutlined, UserOutlined, PaperClipOutlined, PictureOutlined, DeleteOutlined, InboxOutlined, UndoOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
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

const { Text } = Typography;

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
    const { modal, message } = App.useApp();

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
            message.error('Failed to update card');
        }
    };

    const handleDelete = () => {
        modal.confirm({
            title: 'Delete card?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: () => {
                deleteCard(cardId);
                router.push(`/boards/${boardId}`);
            },
        });
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
            {(card.members?.length || card.labels?.length || card.due_date) && (
                <div style={{ marginTop: 16, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Members Section */}
                        {card.members && card.members.length > 0 && (
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    Members
                                </Text>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                                    onClick={onMembersClick}
                                >
                                    {card.members.map((cm) => (
                                        <Tooltip key={cm.id} title={cm.user?.full_name}>
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
                                        type="text"
                                        size="small"
                                        icon={<span style={{ fontSize: 16 }}>+</span>}
                                        style={{ width: 32, height: 32, padding: 0 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Labels Section */}
                        {card.labels && card.labels.length > 0 && (
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    Labels
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
                                                color: 'white',
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
                                        type="text"
                                        size="small"
                                        icon={<span style={{ fontSize: 16 }}>+</span>}
                                        style={{ width: 32, height: 32, padding: 0 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Due Date Section */}
                        {card.due_date && (
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                    Due date
                                </Text>
                                <div
                                    style={{ cursor: 'pointer', display: 'inline-block' }}
                                    onClick={onDueDateClick}
                                >
                                    <DueDateTag
                                        dueDate={card.due_date}
                                        isCompleted={card.is_completed || false}
                                        showIcon={false}
                                    />
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
                        icon={<UserOutlined />}
                        size="small"
                        onClick={onMembersClick}
                    >
                        Members
                    </Button>
                )}
                {/* Show Labels button only when no labels */}
                {(!card.labels || card.labels.length === 0) && (
                    <Button
                        icon={<TagOutlined />}
                        size="small"
                        onClick={onLabelsClick}
                    >
                        Labels
                    </Button>
                )}
                {/* Show Dates button only when no due date */}
                {!card.due_date && (
                    <Button
                        icon={<ClockCircleOutlined />}
                        size="small"
                        onClick={onDueDateClick}
                    >
                        Dates
                    </Button>
                )}
                {/* Show Cover button when not a link card */}
                {!card.link_url && (
                    <Button
                        icon={<PictureOutlined />}
                        size="small"
                        onClick={onCoverClick}
                    >
                        Cover
                    </Button>
                )}
                <Button
                    icon={<CheckSquareOutlined />}
                    size="small"
                    onClick={onAddChecklistTriggered}
                >
                    Checklist
                </Button>
                <Button
                    icon={<PaperClipOutlined />}
                    size="small"
                    onClick={() => attachmentButtonRef?.current?.click()}
                >
                    Attachment
                </Button>
                <ShareCardModal
                    cardId={cardId}
                    cardTitle={card?.title || ''}
                    boardId={boardId}
                    cardData={card}
                    onPrint={onPrint}
                />
                <Button
                    icon={isArchived ? <UndoOutlined /> : <InboxOutlined />}
                    size="small"
                    onClick={handleArchive}
                >
                    {isArchived ? 'Restore' : 'Archive'}
                </Button>
                <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={handleDelete}
                >
                    Delete
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
