'use client';

import React, { useState } from 'react';
import { Popover, Button, Divider, Modal, Input, App } from 'antd';
import styles from './BoardMenuPopover.module.css';
import { useTranslation } from '@/hooks/useLabels';
import {
    ShareAltOutlined,
    InfoCircleOutlined,
    GlobalOutlined,
    LockOutlined,
    StarOutlined,
    StarFilled,
    BgColorsOutlined,
    TagsOutlined,
    InboxOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    BellOutlined,
    BellFilled,
    ColumnWidthOutlined,
    CopyOutlined,
    StopOutlined,
    FormOutlined,
} from '@ant-design/icons';
import { Board, User, CustomField } from '@/types';
import { MenuItem, MenuTitle } from './menu/MenuShared';
import AboutScreen from './menu/AboutScreen';
import BackgroundScreen from './menu/BackgroundScreen';
import ArchivedScreen from './menu/ArchivedScreen';
import CustomFieldsScreen from './menu/CustomFieldsScreen';
import NewFieldScreen from './menu/NewFieldScreen';
import EditFieldScreen from './menu/EditFieldScreen';

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
    const { modal, message } = App.useApp();
    const t = useTranslation();
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
        modal.confirm({
            title: t('UI_DELETE_THIS_BOARD'),
            content: t('UI_DELETE_BOARD_CONFIRM'),
            okText: t('UI_DELETE'),
            okType: 'danger',
            onOk: onDeleteBoard,
        });
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
            <MenuItem icon={<ShareAltOutlined />} label={t('UI_SHARE')} onClick={() => { setOpen(false); onShareClick(); }} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 2: Board info */}
            <MenuItem icon={<InfoCircleOutlined />} label={t('UI_ABOUT_THIS_BOARD')} onClick={() => setScreen('about')} />
            <MenuItem
                icon={(board as any).visibility === 'public' ? <GlobalOutlined /> : <LockOutlined />}
                label={`${t('UI_VISIBILITY')}: ${(board as any).visibility === 'public' ? t('UI_VISIBILITY_PUBLIC') : t('UI_VISIBILITY_PRIVATE')}`}
            />
            <MenuItem
                icon={board.is_starred ? <StarFilled style={{ color: '#f5cd47' }} /> : <StarOutlined />}
                label={board.is_starred ? t('UI_UNSTAR') : t('UI_STAR')}
                onClick={onToggleStar}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 3: Settings */}
            <MenuItem icon={<BgColorsOutlined />} label={t('UI_CHANGE_BACKGROUND')} onClick={() => setScreen('background')} />
            <MenuItem
                icon={board.show_card_covers ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                label={board.show_card_covers ? t('UI_HIDE_CARD_COVERS') : t('UI_SHOW_CARD_COVERS')}
                onClick={handleToggleCardCovers}
            />
            <MenuItem icon={<TagsOutlined />} label={t('UI_LABELS')} onClick={() => message.info(t('UI_COMING_SOON'))} />
            <MenuItem icon={<FormOutlined />} label={t('UI_CUSTOM_FIELDS')} onClick={() => setScreen('customFields')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 4: Archive */}
            <MenuItem icon={<InboxOutlined />} label={t('UI_ARCHIVED_ITEMS')} onClick={() => setScreen('archived')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 5: Board Actions */}
            <MenuItem
                icon={board.is_watching ? <BellFilled style={{ color: '#1890ff' }} /> : <BellOutlined />}
                label={board.is_watching ? t('UI_WATCHING') : t('UI_WATCH')}
                onClick={onToggleWatch}
            />
            <MenuItem
                icon={<ColumnWidthOutlined />}
                label={t('UI_EXPAND_ALL_LISTS')}
                onClick={async () => {
                    await onExpandAllLists();
                }}
            />
            <MenuItem
                icon={<ColumnWidthOutlined style={{ transform: 'rotate(90deg)' }} />}
                label={t('UI_COLLAPSE_ALL_LISTS')}
                onClick={async () => {
                    await onCollapseAllLists();
                }}
            />
            <MenuItem
                icon={<CopyOutlined />}
                label={t('UI_COPY_BOARD')}
                onClick={() => {
                    setCopyTitle(board.title + ' (copy)');
                    setCopyModalOpen(true);
                    setOpen(false);
                }}
            />
            <MenuItem
                icon={<StopOutlined />}
                label={t('UI_CLOSE_BOARD')}
                onClick={() => message.info(t('UI_CLOSE_BOARD_COMING_SOON'))}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 6: Delete */}
            <MenuItem icon={<DeleteOutlined />} label={t('UI_DELETE_BOARD')} onClick={handleDelete} danger />
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
                        initialColor={board.background_color || '#0079bf'}
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
                content={renderContent()}
                trigger="click"
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                arrow={false}
                overlayClassName={styles.popover}
            >
                {children}
            </Popover>

            <Modal
                title={t('UI_COPY_BOARD')}
                open={copyModalOpen}
                onCancel={() => setCopyModalOpen(false)}
                onOk={async () => {
                    if (copyTitle.trim()) {
                        await onCopyBoard(copyTitle.trim());
                        setCopyModalOpen(false);
                    }
                }}
                okText={t('UI_CREATE_COPY')}
            >
                <div style={{ marginTop: 16 }}>
                    <label>{t('UI_BOARD_TITLE')}</label>
                    <Input
                        value={copyTitle}
                        onChange={(e) => setCopyTitle(e.target.value)}
                        placeholder={t('UI_PLACEHOLDER_BOARD_TITLE')}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </>
    );
}
