'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Tooltip, Tag, message, Dropdown, Popover } from 'antd';
import type { MenuProps } from 'antd';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    CommentOutlined,
    CheckSquareOutlined,
    CalendarOutlined,
    NumberOutlined,
    FontSizeOutlined,
    AppstoreOutlined,
    MoreOutlined,
    FileTextOutlined,
    LinkOutlined,
    EditOutlined,
    UserOutlined,
    TagOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { Card } from '@/types';
import { useBoardStore } from '@/stores/boardStore';
import styles from './KanbanBoard.module.css';
import UserAvatar from '@/components/common/UserAvatar';
import DueDateTag from '@/components/common/DueDateTag';
import EditableTitle from '@/components/common/EditableTitle';
import api, { linkPreviewApi } from '@/lib/api';
import LinkPreviewCard from '@/components/card/LinkPreviewCard';
import MembersPickerModal from '@/components/card/MembersPickerModal';
import DueDatePickerModal from '@/components/card/DueDatePickerModal';
import CoverImagePickerModal from '@/components/card/CoverImagePickerModal';
import LabelPickerModal from '@/components/card/LabelPickerModal';
import { useAttachments, useWorkspaceMembers, useBoardLabels } from '@/hooks/useCards';

const { Text } = Typography;

interface KanbanCardProps {
    card: Card;
    listId: string;
    readOnly?: boolean;
    showCovers?: boolean; // Optional override for showCardCovers
    onCardClick?: (card: Card) => void; // Custom click handler for readOnly mode
    onDeleteCard?: (cardId: string) => void; // Custom delete handler
}

export default function KanbanCard({ card, listId, readOnly = false, showCovers, onCardClick, onDeleteCard }: KanbanCardProps) {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const showCardCoversFromStore = useBoardStore((state) => state.showCardCovers);
    const currentBoard = useBoardStore((state) => state.currentBoard);
    const fetchBoard = useBoardStore((state) => state.fetchBoard);
    const updateCard = useBoardStore((state) => state.updateCard);
    const showCardCovers = showCovers ?? showCardCoversFromStore;
    const [isConverting, setIsConverting] = useState(false);

    // Get workspace members and board labels using hooks
    const { data: workspaceMembers = [] } = useWorkspaceMembers(currentBoard?.workspace_id || '');
    const { data: boardLabels = [] } = useBoardLabels(boardId || '');

    // Fetch attachments for cover image picker
    const { data: attachments = [] } = useAttachments(card.id);

    // Modal states for card editing
    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [labelsModalOpen, setLabelsModalOpen] = useState(false);
    const [dueDateModalOpen, setDueDateModalOpen] = useState(false);
    const [coverModalOpen, setCoverModalOpen] = useState(false);

    // Check if title is a valid URL
    const isTitleURL = () => {
        const trimmedTitle = card.title.trim();
        return /^https?:\/\/.+/.test(trimmedTitle);
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: 'card',
            card,
            listId,
        },
        disabled: readOnly,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Check if card has link preview data
    const hasLinkPreview = Boolean(card.link_url && (card.link_title || card.link_image));

    // Handle click on external link button
    const handleExternalLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (card.link_url) {
            window.open(card.link_url, '_blank', 'noopener,noreferrer');
        }
    };

    // Handle convert to link card
    const handleConvertToLinkCard = async () => {
        if (!isTitleURL()) {
            message.error('Card title must be a valid URL');
            return;
        }
        setIsConverting(true);
        try {
            await linkPreviewApi.refresh(card.id);
            message.success('Converted to link card');
            if (boardId) {
                await fetchBoard(boardId);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to convert to link card');
        } finally {
            setIsConverting(false);
        }
    };

    // Handle convert to regular card
    const handleConvertToRegularCard = async () => {
        setIsConverting(true);
        try {
            await linkPreviewApi.clear(card.id);
            message.success('Converted to regular card');
            if (boardId) {
                await fetchBoard(boardId);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to convert to regular card');
        } finally {
            setIsConverting(false);
        }
    };

    // Handle card update
    const handleCardUpdate = async () => {
        if (boardId) {
            await fetchBoard(boardId);
        }
    };

    // Handle title save
    const handleTitleSave = async (newTitle: string) => {
        await updateCard(card.id, { title: newTitle });
    };

    // Menu items for dropdown
    const menuItems: MenuProps['items'] = [
        {
            key: 'members',
            label: 'Members',
            icon: <UserOutlined />,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                setMembersModalOpen(true);
            },
        },
        {
            key: 'labels',
            label: 'Labels',
            icon: <TagOutlined />,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                setLabelsModalOpen(true);
            },
        },
        {
            key: 'duedate',
            label: 'Due Date',
            icon: <ClockCircleOutlined />,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                setDueDateModalOpen(true);
            },
        },
        {
            key: 'cover',
            label: 'Cover',
            icon: <PictureOutlined />,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                setCoverModalOpen(true);
            },
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'convert',
            label: hasLinkPreview ? 'Convert to Regular Card' : 'Convert to Link Card',
            icon: hasLinkPreview ? <FileTextOutlined /> : <LinkOutlined />,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                if (hasLinkPreview) {
                    handleConvertToRegularCard();
                } else {
                    handleConvertToLinkCard();
                }
            },
            disabled: !isTitleURL() || isConverting,
        },
        onDeleteCard ? {
            key: 'delete',
            label: 'Delete',
            icon: <EditOutlined />,
            danger: true,
            onClick: (info: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
                info.domEvent.stopPropagation();
                onDeleteCard(card.id);
            },
        } : null,
    ].filter(Boolean);

    const handleCardClick = () => {
        // If custom click handler provided, use it
        if (onCardClick) {
            onCardClick(card);
            return;
        }
        
        if (readOnly) return;
        
        // If link card, open URL in new tab
        if (hasLinkPreview && card.link_url) {
            window.open(card.link_url, '_blank', 'noopener,noreferrer');
            return;
        }
        
        // Navigate to separate card page
        router.push(`/boards/${boardId}/cards/${card.id}`);
    };

    // Render custom field value from card's custom_field_values
    // Each value has custom_field nested inside with show_on_card flag
    const renderCustomFieldTags = () => {
        if (!card.custom_field_values || card.custom_field_values.length === 0) {
            return null;
        }

        return card.custom_field_values
            .filter(cfv => cfv.custom_field?.show_on_card)
            .map(cfv => {
                const field = cfv.custom_field;
                if (!field) return null;

                // Common badge style
                const badgeStyle = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: 'var(--bg-tertiary)',
                };

                switch (field.type) {
                    case 'checkbox':
                        if (cfv.value === 'true') {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'dropdown':
                        if (cfv.option) {
                            return (
                                <div 
                                    key={cfv.id} 
                                    style={{
                                        ...badgeStyle,
                                        backgroundColor: cfv.option.color || 'var(--bg-tertiary)',
                                    }}
                                >
                                    <AppstoreOutlined style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-secondary)',
                                        fontSize: 12,
                                    }} />
                                    <span style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-secondary)',
                                    }}>
                                        {field.name}:
                                    </span>
                                    <span style={{ 
                                        color: cfv.option.color ? 'white' : 'var(--text-primary)',
                                        fontWeight: 500,
                                    }}>
                                        {cfv.option.value}
                                    </span>
                                </div>
                            );
                        }
                        return null;

                    case 'text':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <FontSizeOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{cfv.value}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'number':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <NumberOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{cfv.value}</span>
                                </div>
                            );
                        }
                        return null;

                    case 'date':
                        if (cfv.value) {
                            return (
                                <div key={cfv.id} style={badgeStyle}>
                                    <CalendarOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{field.name}:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>
                                        {new Date(cfv.value).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        }
                        return null;

                    default:
                        return null;
                }
            })
            .filter(Boolean);
    };

    const customFieldTags = renderCustomFieldTags();

    return (
        <>
            <div
                ref={readOnly ? undefined : setNodeRef}
                style={readOnly ? { cursor: 'default' } : style}
                className={styles.card}
                onClick={handleCardClick}
                {...(readOnly ? {} : attributes)}
                {...(readOnly ? {} : listeners)}
            >
            {/* Card Menu */}
            {!readOnly && (
                <div
                    style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        zIndex: 10,
                    }}
                >
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                cursor: 'pointer',
                                padding: 8,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                            }}
                            className={styles.cardMenuButton}
                        >
                            <EditOutlined style={{ fontSize: 14, color: '#fff' }} />
                        </div>
                    </Dropdown>
                </div>
            )}

            {/* Link Preview or Regular Content */}
            {hasLinkPreview ? (
                <LinkPreviewCard
                    cardId={card.id}
                    cardTitle={card.title}
                    linkUrl={card.link_url!}
                    linkTitle={card.link_title || card.title}
                    linkDescription={card.link_description}
                    linkImage={card.link_image}
                    linkFavicon={card.link_favicon}
                    linkSiteName={card.link_site_name}
                    showCardCovers={showCardCovers}
                    onRefresh={async () => {
                        if (boardId) {
                            await fetchBoard(boardId);
                        }
                    }}
                    onExternalClick={handleExternalLinkClick}
                    onUrlSave={handleTitleSave}
                    readOnly={readOnly}
                />
            ) : (
                <>
                    {/* Cover Image */}
                    {showCardCovers && card.cover_image && (
                        <div
                            style={{
                                height: 120,
                                marginBottom: 8,
                                borderRadius: 4,
                                overflow: 'hidden',
                                marginTop: -8,
                                marginLeft: -8,
                                marginRight: -8,
                                width: 'calc(100% + 16px)',
                            }}
                        >
                            <img
                                src={card.cover_image}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: `center ${card.cover_image_y ?? 50}%`,
                                }}
                            />
                        </div>
                    )}

                    {/* Labels */}
                    {card.labels && card.labels.length > 0 && (
                        <div className={styles.cardLabels}>
                            {card.labels.map((cl) => (
                                <div
                                    key={cl.id}
                                    className={styles.cardLabel}
                                    style={{ backgroundColor: cl.label?.color }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <EditableTitle
                            value={card.title}
                            onSave={handleTitleSave}
                            disabled={readOnly}
                            textStyle={{ fontSize: 14 }}
                            inputStyle={{ fontSize: 14 }}
                            size="small"
                        />
                    </div>
                </>
            )}

            {/* Labels for Link Preview Cards */}
            {hasLinkPreview && card.labels && card.labels.length > 0 && (
                <div className={styles.cardLabels}>
                    {card.labels.map((cl) => (
                        <div
                            key={cl.id}
                            className={styles.cardLabel}
                            style={{ backgroundColor: cl.label?.color }}
                        />
                    ))}
                </div>
            )}

            {/* Custom Fields */}
            {customFieldTags && customFieldTags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {customFieldTags}
                </div>
            )}

            {/* Footer */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                }}
            >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {card.due_date && (
                        <DueDateTag
                            dueDate={card.due_date}
                            isCompleted={card.is_completed}
                            showIcon
                            size="small"
                        />
                    )}

                    {card.comments && card.comments.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                            }}
                        >
                            <CommentOutlined style={{ fontSize: 12 }} />
                            {card.comments.length}
                        </div>
                    )}
                </div>

                {/* Members */}
                {card.members && card.members.length > 0 && (
                    <div style={{ display: 'flex', marginLeft: 'auto' }}>
                        {card.members.slice(0, 3).map((cm) => (
                            <Tooltip key={cm.id} title={cm.user?.full_name}>
                                <div style={{ marginLeft: -4 }}>
                                    <UserAvatar
                                        avatarUrl={cm.user?.avatar_url}
                                        name={cm.user?.full_name}
                                        size="small"
                                    />
                                </div>
                            </Tooltip>
                        ))}
                        {card.members.length > 3 && (
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: '#0052cc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                color: 'white',
                                marginLeft: -4,
                            }}>
                                +{card.members.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

            {/* Modals for card editing */}
            <MembersPickerModal
                open={membersModalOpen}
                onClose={() => setMembersModalOpen(false)}
                cardId={card.id}
                cardMembers={card.members || []}
                workspaceMembers={workspaceMembers}
                onUpdate={handleCardUpdate}
            />

            <LabelPickerModal
                open={labelsModalOpen}
                onClose={() => setLabelsModalOpen(false)}
                cardId={card.id}
                boardId={boardId}
                labels={boardLabels}
                selectedLabelIds={card.labels?.map((cl) => cl.label_id) || []}
                onRefresh={handleCardUpdate}
                onCardRefresh={handleCardUpdate}
            />

            <DueDatePickerModal
                open={dueDateModalOpen}
                onClose={() => setDueDateModalOpen(false)}
                cardId={card.id}
                boardId={boardId}
                dueDate={card.due_date}
                isCompleted={card.is_completed || false}
                onUpdate={(updates) => {
                    handleCardUpdate();
                }}
            />

            <CoverImagePickerModal
                open={coverModalOpen}
                onClose={() => setCoverModalOpen(false)}
                cardId={card.id}
                attachments={attachments}
                currentCover={card.cover_image}
                onUpdate={(coverImage) => {
                    handleCardUpdate();
                }}
            />
        </>
    );
}
