'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Typography, Button, App } from 'antd';
import { Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useCard, useBoardLabels, useWorkspaceMembers, useAddComment, useChecklists, useAttachments } from '@/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';

// Card components
import CardHeader from '@/components/card/CardHeader';
import CardMainContent from '@/components/card/CardMainContent';
import CardSidebar from '@/components/card/CardSidebar';
import MembersPickerModal from '@/components/card/MembersPickerModal';
import DueDatePickerModal from '@/components/card/DueDatePickerModal';
import CoverImagePickerModal from '@/components/card/CoverImagePickerModal';
import LabelPickerModal from '@/components/card/LabelPickerModal';
import styles from './CardPageContent.module.css';

const { Text } = Typography;

export default function CardPageContent() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const cardId = params.cardId as string;

    const { updateCard, currentBoard, fetchBoard } = useBoardStore();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const invalidateBoardCache = () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    };

    // Print Logic
    const printContentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printContentRef,
    });

    // React Query hooks
    const { data: cardData, isLoading: isCardLoading, refetch: refetchCard } = useCard(cardId);
    const { data: boardLabels = [], refetch: refetchLabels } = useBoardLabels(boardId);
    const { data: workspaceMembers = [] } = useWorkspaceMembers(currentBoard?.workspace_id || '');
    const { data: checklists = [], refetch: refetchChecklists } = useChecklists(cardId);
    const { data: attachments = [], refetch: refetchAttachments } = useAttachments(cardId);
    const addCommentMutation = useAddComment(cardId);

    // Local state
    const [card, setCard] = useState<Card | null>(null);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);

    // Modal states
    const [membersOpen, setMembersOpen] = useState(false);
    const [labelsOpen, setLabelsOpen] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);
    const [coverOpen, setCoverOpen] = useState(false);
    const [triggerAddChecklist, setTriggerAddChecklist] = useState(false);

    const attachmentButtonRef = useRef<HTMLElement>(null);

    // Fetch board for workspace context
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (!currentBoard || currentBoard.id !== boardId) {
                    await fetchBoard(boardId);
                }
            } catch (error) {
                message.error('Failed to load board');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [boardId, fetchBoard, currentBoard]);

    // Sync card data from React Query
    useEffect(() => {
        if (cardData) {
            setCard(cardData);
            setDescription(cardData.description || '');

        }
    }, [cardData]);

    const handleBack = () => router.push(`/boards/${boardId}`);

    // Handlers
    const handleTitleSave = async (newTitle: string) => {
        if (!card) return;
        setCard({ ...card, title: newTitle });
        await updateCard(card.id, { title: newTitle });
        invalidateBoardCache();
    };

    const handleCompletedChange = async (checked: boolean) => {
        if (!card) return;
        setCard({ ...card, is_completed: checked });
        await updateCard(card.id, { is_completed: checked });
        invalidateBoardCache();
    };

    const handleDescSave = () => {
        if (!card) return;
        if (description !== card.description) {
            updateCard(card.id, { description });
        }
        setIsEditingDesc(false);
    };

    // Loading states
    if (loading || isCardLoading) {
        return (
            <div className="loading-container" style={{ minHeight: 300 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="loading-container" style={{ minHeight: 300, flexDirection: 'column', gap: 16 }}>
                <Text>Card not found</Text>
                <Button onClick={handleBack}>Back to board</Button>
            </div>
        );
    }

    return (
        <div
            ref={printContentRef}
            className={styles.printableCard}
            style={{
                height: 'auto',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
            }}
        >
            <CardHeader
                title={card.title}
                isCompleted={card.is_completed || false}
                onTitleSave={handleTitleSave}
                onCompletedChange={handleCompletedChange}
                onBack={handleBack}
                hideBackButton
            />

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden',
                    maxHeight: 'calc(90vh - 180px)',
                }}
                className={`card-detail-container ${styles.cardDetailContainer}`}
            >

                <CardMainContent
                    card={card}
                    cardId={cardId}
                    boardId={boardId}
                    description={description}
                    isEditingDesc={isEditingDesc}
                    checklists={checklists}
                    attachments={attachments}
                    workspaceMembers={workspaceMembers}
                    lists={currentBoard?.lists || []}
                    onDescriptionChange={setDescription}
                    onDescriptionSave={handleDescSave}
                    onDescriptionCancel={() => {
                        setDescription(card.description || '');
                        setIsEditingDesc(false);
                    }}
                    onDescriptionEditStart={() => setIsEditingDesc(true)}
                    onChecklistUpdate={refetchChecklists}
                    onAttachmentUpdate={refetchAttachments}
                    onCoverChange={(url) => setCard({ ...card, cover_image: url })}
                    onMembersClick={() => setMembersOpen(true)}
                    onLabelsClick={() => setLabelsOpen(true)}
                    onDueDateClick={() => setDueDateOpen(true)}
                    triggerAddChecklist={triggerAddChecklist}
                    onAddChecklistTriggered={() => setTriggerAddChecklist(!triggerAddChecklist)}
                    attachmentButtonRef={attachmentButtonRef}
                    onCoverClick={() => setCoverOpen(true)}
                    isArchived={card.is_archived || false}
                    onArchiveChange={(isArchived) => {
                        setCard({ ...card, is_archived: isArchived });
                        invalidateBoardCache();
                    }}
                    onPrint={handlePrint}
                />

                <CardSidebar
                    currentUser={user}
                    comments={card?.comments || []}
                    isAddingComment={addCommentMutation.isPending}
                    onAddComment={(content) => addCommentMutation.mutateAsync(content)}
                />
            </div>

            {/* Modals - Outside of printable content if we wanted, but inside is also fine since we hide them or react-to-print ignores them if we ref specific div */}
            {/* Wait, modals are portals in Ant Design, so they are OUTSIDE this div by default anyway! */}

            <MembersPickerModal
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                cardId={cardId}
                cardMembers={card.members || []}
                workspaceMembers={workspaceMembers}
                onUpdate={async () => {
                    await refetchCard();
                    invalidateBoardCache();
                }}
            />

            <LabelPickerModal
                open={labelsOpen}
                onClose={() => setLabelsOpen(false)}
                cardId={cardId}
                boardId={boardId}
                labels={boardLabels}
                selectedLabelIds={card.labels?.map((cl) => cl.label_id) || []}
                onRefresh={refetchLabels}
                onCardRefresh={refetchCard}
            />

            <DueDatePickerModal
                open={dueDateOpen}
                onClose={() => setDueDateOpen(false)}
                cardId={cardId}
                boardId={boardId}
                dueDate={card.due_date}
                isCompleted={card.is_completed || false}
                onUpdate={(updates) => setCard({ ...card, ...updates })}
            />

            <CoverImagePickerModal
                open={coverOpen}
                onClose={() => setCoverOpen(false)}
                cardId={cardId}
                attachments={attachments}
                currentCover={card.cover_image}
                onUpdate={(coverImage) => {
                    setCard({ ...card, cover_image: coverImage });
                    invalidateBoardCache();
                    refetchCard();
                }}
            />
        </div >
    );
}
