'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Typography, Button, App } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useHeader } from '@/providers/HeaderProvider';
import { useCard, useBoardLabels, useWorkspaceMembers, useAddComment, useChecklists, useAttachments } from '@/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';

// Card components
import CardHeader from '@/components/card/CardHeader';
import CardMainContent from '@/components/card/CardMainContent';
import CardSidebar from '@/components/card/CardSidebar';
import MembersPickerModal from '@/components/card/MembersPickerModal';
import DueDatePickerModal from '@/components/card/DueDatePickerModal';
import CoverImagePickerModal from '@/components/card/CoverImagePickerModal';

const { Text } = Typography;

export default function CardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const cardId = params.cardId as string;

    const { updateCard, currentBoard, fetchBoard } = useBoardStore();
    const { user } = useAuthStore();
    const { setHeaderContent } = useHeader();
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const invalidateBoardCache = () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    };

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
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);

    // Modal states
    const [membersOpen, setMembersOpen] = useState(false);
    const [labelsOpen, setLabelsOpen] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);
    const [coverOpen, setCoverOpen] = useState(false);
    const [coverPosition, setCoverPosition] = useState(50);

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
            setTitle(cardData.title);
            setDescription(cardData.description || '');
            setCoverPosition(cardData.cover_image_y ?? 50);
        }
    }, [cardData]);

    const handleBack = () => router.push(`/boards/${boardId}`);

    // Dynamic header
    useEffect(() => {
        if (card) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
                    <Text strong style={{ fontSize: 16 }}>{card.title}</Text>
                </div>
            );
        }
        return () => setHeaderContent(null);
    }, [card]);

    // Handlers
    const handleTitleSave = () => {
        if (!card) return;
        if (title.trim() && title !== card.title) {
            setCard({ ...card, title: title.trim() });
            updateCard(card.id, { title: title.trim() });
            invalidateBoardCache();
        }
        setIsEditingTitle(false);
    };

    const handleDescSave = () => {
        if (!card) return;
        if (description !== card.description) {
            updateCard(card.id, { description });
        }
        setIsEditingDesc(false);
    };

    const handleToggleLabel = async (labelId: string) => {
        if (!card) return;
        const hasLabel = card.labels?.some((cl) => cl.label_id === labelId);
        const label = boardLabels.find((l) => l.id === labelId);

        if (hasLabel) {
            setCard({ ...card, labels: card.labels?.filter((cl) => cl.label_id !== labelId) || [] });
        } else if (label) {
            setCard({ ...card, labels: [...(card.labels || []), { id: `temp-${Date.now()}`, label_id: labelId, card_id: card.id, label }] });
        }

        try {
            if (hasLabel) {
                await api.delete(`/cards/${card.id}/labels/${labelId}`);
            } else {
                await api.post(`/cards/${card.id}/labels`, { label_id: labelId });
            }
            invalidateBoardCache();
            refetchCard();
        } catch (error) {
            message.error('Failed to update label');
            refetchCard();
        }
    };

    const handleCoverPositionSave = async (value: number) => {
        if (!card) return;
        try {
            await api.put(`/cards/${card.id}`, { cover_image_y: value });
            setCard({ ...card, cover_image_y: value });
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
            message.success('Position updated');
        } catch (error) {
            message.error('Failed to update position');
        }
    };

    // Loading states - show loading while fetching board or card
    if (loading || isCardLoading) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
                <Text>Card not found</Text>
                <Button onClick={handleBack}>Back to board</Button>
            </div>
        );
    }

    return (
        <div
            style={{
                height: 'calc(100vh - 64px)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <CardHeader
                title={isEditingTitle ? title : card.title}
                isEditing={isEditingTitle}
                onTitleChange={setTitle}
                onTitleSave={handleTitleSave}
                onEditStart={() => setIsEditingTitle(true)}
                onBack={handleBack}
            />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <CardMainContent
                    card={card}
                    cardId={cardId}
                    boardId={boardId}
                    coverPosition={coverPosition}
                    description={description}
                    isEditingDesc={isEditingDesc}
                    checklists={checklists}
                    attachments={attachments}
                    workspaceMembers={workspaceMembers}
                    lists={currentBoard?.lists || []}
                    onCoverPositionChange={setCoverPosition}
                    onCoverPositionSave={handleCoverPositionSave}
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
                />

                <CardSidebar
                    card={card}
                    cardId={cardId}
                    boardId={boardId}
                    currentUser={user}
                    workspaceMembers={workspaceMembers}
                    boardLabels={boardLabels}
                    comments={card?.comments || []}
                    isAddingComment={addCommentMutation.isPending}
                    labelsOpen={labelsOpen}
                    onLabelsOpenChange={setLabelsOpen}
                    onMembersClick={() => setMembersOpen(true)}
                    onDueDateClick={() => setDueDateOpen(true)}
                    onCoverClick={() => setCoverOpen(true)}
                    onLabelToggle={handleToggleLabel}
                    onLabelsRefresh={refetchLabels}
                    onCardRefresh={refetchCard}
                    onAddComment={(content) => addCommentMutation.mutateAsync(content)}
                    onArchiveChange={(isArchived) => setCard({ ...card, is_archived: isArchived })}
                />
            </div>

            {/* Modals */}
            <MembersPickerModal
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                cardId={cardId}
                cardMembers={card.members || []}
                workspaceMembers={workspaceMembers}
                onUpdate={() => {
                    refetchCard();
                    invalidateBoardCache();
                }}
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
                onUpdate={(coverImage) => setCard({ ...card, cover_image: coverImage })}
            />
        </div>
    );
}
