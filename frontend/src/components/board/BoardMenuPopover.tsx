'use client';

import React, { useState } from 'react';
import styles from './BoardMenuPopover.module.css';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';
import { Board, User, CustomField } from '@/types';
import { MenuItem, MenuTitle } from './menu/MenuShared';
import AboutScreen from './menu/AboutScreen';
import BackgroundScreen from './menu/BackgroundScreen';
import ArchivedScreen from './menu/ArchivedScreen';
import CustomFieldsScreen from './menu/CustomFieldsScreen';
import NewFieldScreen from './menu/NewFieldScreen';
import EditFieldScreen from './menu/EditFieldScreen';

import { Popover, Button, Divider, Modal, TextInput, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShare, IconInfoCircle, IconWorld, IconLock, IconStar, IconStarFilled, IconPalette, IconTags, IconInbox, IconTrash, IconEye, IconEyeOff, IconBell, IconBellFilled, IconColumnInsertRight, IconCopy, IconPlayerStop, IconForms } from '@tabler/icons-react';

type MenuScreen = 'main' | 'about' | 'background' | 'archived' | 'customFields' | 'newField' | 'editField';

interface BoardMenuPopoverProps {
    board: Board;
    workspaceMembers?: (User & { role?: string })[];
    onShareClick: () => void;
    onToggleStar: () => void;
    onToggleWatch: () => void;
    onExpandAllLists: () => Promise<void>;
    onCollapseAllLists: () => Promise<void>;
    onCopyBoard: (title: string) => Promise<void>;
    onUpdateBoard: (data: Partial<Board>) => Promise<void>;
    onDeleteBoard: () => void;
    onCardClick?: (cardId: string) => void;
    children: React.ReactNode;
}

export default function BoardMenuPopover({
    board,
    workspaceMembers = [],
    onShareClick,
    onToggleStar,
    onToggleWatch,
    onExpandAllLists,
    onCollapseAllLists,
    onCopyBoard,
    onUpdateBoard,
    onDeleteBoard,
    onCardClick,
    children,
}: BoardMenuPopoverProps) {
    const t = useTranslation();
    const token = useAppToken();
    const [open, setOpen] = useState(false);
    const [screen, setScreen] = useState<MenuScreen>('main');
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copyTitle, setCopyTitle] = useState('');
    const [selectedField, setSelectedField] = useState<CustomField | null>(null);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset to main screen when closing
            setTimeout(() => setScreen('main'), 200);
        }
    };

    const goBack = () => setScreen('main');

    const handleDelete = () => {
        setOpen(false);
        onDeleteBoard();
    };

    const handleUpdateDescription = async (description: string) => {
        await onUpdateBoard({ description });
    };

    const handleUpdateBackground = async (color: string, image: string) => {
        await onUpdateBoard({ background_color: color, background_image: image });
    };

    const handleToggleCardCovers = async () => {
        await onUpdateBoard({ show_card_covers: !board.show_card_covers });
    };

    // Main menu screen
    const renderMainScreen = () => (
        <div style={{ width: 280, maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            <MenuTitle title={t('UI_MENU')} />

            {/* Section 1 */}
            <MenuItem icon={<IconShare size={16} />} label={t('UI_SHARE')} onClick={() => { setOpen(false); onShareClick(); }} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 2: Board info */}
            <MenuItem icon={<IconInfoCircle size={16} />} label={t('UI_ABOUT_THIS_BOARD')} onClick={() => setScreen('about')} />
            <MenuItem
                icon={(board as any).visibility === 'public' ? <IconWorld size={16} /> : <IconLock size={16} />}
                label={`${t('UI_VISIBILITY')}: ${(board as any).visibility === 'public' ? t('UI_VISIBILITY_PUBLIC') : t('UI_VISIBILITY_PRIVATE')}`}
            />
            <MenuItem
                icon={board.is_starred ? <IconStarFilled size={16} style={{ color: token.colorStarYellow }} /> : <IconStar size={16} />}
                label={board.is_starred ? t('UI_UNSTAR') : t('UI_STAR')}
                onClick={onToggleStar}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 3: Settings */}
            <MenuItem icon={<IconPalette size={16} />} label={t('UI_CHANGE_BACKGROUND')} onClick={() => setScreen('background')} />
            <MenuItem
                icon={board.show_card_covers ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                label={board.show_card_covers ? t('UI_HIDE_CARD_COVERS') : t('UI_SHOW_CARD_COVERS')}
                onClick={handleToggleCardCovers}
            />
            <MenuItem icon={<IconTags size={16} />} label={t('UI_LABELS')} onClick={() => notifications.show({ message: t('UI_COMING_SOON'), color: 'blue' })} />
            <MenuItem icon={<IconForms size={16} />} label={t('UI_CUSTOM_FIELDS')} onClick={() => setScreen('customFields')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 4: Archive */}
            <MenuItem icon={<IconInbox size={16} />} label={t('UI_ARCHIVED_ITEMS')} onClick={() => setScreen('archived')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 5: Board Actions */}
            <MenuItem
                icon={board.is_watching ? <IconBellFilled size={16} style={{ color: token.colorPrimary }} /> : <IconBell size={16} />}
                label={board.is_watching ? t('UI_WATCHING') : t('UI_WATCH')}
                onClick={onToggleWatch}
            />
            <MenuItem
                icon={<IconColumnInsertRight size={16} />}
                label={t('UI_EXPAND_ALL_LISTS')}
                onClick={async () => {
                    await onExpandAllLists();
                }}
            />
            <MenuItem
                icon={<IconColumnInsertRight size={16} style={{ transform: 'rotate(90deg)' }} />}
                label={t('UI_COLLAPSE_ALL_LISTS')}
                onClick={async () => {
                    await onCollapseAllLists();
                }}
            />
            <MenuItem
                icon={<IconCopy size={16} />}
                label={t('UI_COPY_BOARD')}
                onClick={() => {
                    setCopyTitle(board.title + ' (copy)');
                    setCopyModalOpen(true);
                    setOpen(false);
                }}
            />
            <MenuItem
                icon={<IconPlayerStop size={16} />}
                label={t('UI_CLOSE_BOARD')}
                onClick={() => notifications.show({ message: t('UI_CLOSE_BOARD_COMING_SOON'), color: 'blue' })}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 6: Delete */}
            <MenuItem icon={<IconTrash size={16} />} label={t('UI_DELETE_BOARD')} onClick={handleDelete} danger />
        </div>
    );

    const renderContent = () => {
        switch (screen) {
            case 'about':
                return (
                    <AboutScreen
                        board={board}
                        workspaceMembers={workspaceMembers}
                        onBack={goBack}
                        onUpdateDescription={handleUpdateDescription}
                    />
                );
            case 'background':
                return (
                    <BackgroundScreen
                        initialColor={board.background_color || '#206A5D'}
                        initialImage={board.background_image || ''}
                        onBack={goBack}
                        onSave={handleUpdateBackground}
                    />
                );
            case 'archived':
                return (
                    <ArchivedScreen
                        boardId={board.id}
                        onBack={goBack}
                        onCardClick={(cardId) => {
                            setOpen(false);
                            if (onCardClick) onCardClick(cardId);
                        }}
                    />
                );
            case 'customFields':
                return (
                    <CustomFieldsScreen
                        boardId={board.id}
                        onBack={goBack}
                        onNewField={() => setScreen('newField')}
                        onEditField={(field) => {
                            setSelectedField(field);
                            setScreen('editField');
                        }}
                    />
                );
            case 'newField':
                return (
                    <NewFieldScreen
                        boardId={board.id}
                        onBack={() => setScreen('customFields')}
                        onCreate={() => setScreen('customFields')}
                    />
                );
            case 'editField':
                return selectedField ? (
                    <EditFieldScreen
                        field={selectedField}
                        onBack={() => setScreen('customFields')}
                        onUpdate={() => setScreen('customFields')}
                        onDelete={() => setScreen('customFields')}
                    />
                ) : null;
            default:
                return renderMainScreen();
        }
    };

    return (
        <>
            <Popover
                opened={open}
                onChange={handleOpenChange}
                position="bottom-end"
                shadow="md"
            >
                <Popover.Target>
                    {children}
                </Popover.Target>
                <Popover.Dropdown style={{ padding: 0 }} className={styles.popover}>
                    {renderContent()}
                </Popover.Dropdown>
            </Popover>

            <Modal
                title={t('UI_COPY_BOARD')}
                opened={copyModalOpen}
                onClose={() => setCopyModalOpen(false)}
            >
                <div style={{ marginTop: 16 }}>
                    <label>{t('UI_BOARD_TITLE')}</label>
                    <TextInput
                        value={copyTitle}
                        onChange={(e) => setCopyTitle(e.target.value)}
                        placeholder={t('UI_PLACEHOLDER_BOARD_TITLE')}
                        style={{ marginTop: 8 }}
                    />
                </div>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setCopyModalOpen(false)}>
                        {t('UI_CANCEL') || 'Cancel'}
                    </Button>
                    <Button
                        onClick={async () => {
                            if (copyTitle.trim()) {
                                await onCopyBoard(copyTitle.trim());
                                setCopyModalOpen(false);
                            }
                        }}
                    >
                        {t('UI_CREATE_COPY')}
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
