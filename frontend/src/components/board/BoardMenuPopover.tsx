'use client';

import React, { useState } from 'react';
import { Popover, Button, Divider, message, Modal } from 'antd';
import styles from './BoardMenuPopover.module.css';
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
} from '@ant-design/icons';
import { Board, User } from '@/types';
import { MenuItem, MenuTitle } from './menu/MenuShared';
import AboutScreen from './menu/AboutScreen';
import BackgroundScreen from './menu/BackgroundScreen';
import ArchivedScreen from './menu/ArchivedScreen';

type MenuScreen = 'main' | 'about' | 'background' | 'archived';

interface BoardMenuPopoverProps {
    board: Board;
    workspaceMembers?: (User & { role?: string })[];
    onShareClick: () => void;
    onToggleStar: () => void;
    onToggleWatch: () => void;
    onExpandAllLists: () => Promise<void>;
    onCollapseAllLists: () => Promise<void>;
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
    onUpdateBoard,
    onDeleteBoard,
    onCardClick,
    children,
}: BoardMenuPopoverProps) {
    const [open, setOpen] = useState(false);
    const [screen, setScreen] = useState<MenuScreen>('main');

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
        Modal.confirm({
            title: 'Delete this board?',
            content: 'This action cannot be undone. All lists and cards will be permanently deleted.',
            okText: 'Delete',
            okType: 'danger',
            onOk: onDeleteBoard,
        });
    };

    const handleUpdateDescription = async (description: string) => {
        await onUpdateBoard({ description });
        message.success('Description updated');
    };

    const handleUpdateBackground = async (color: string, image: string) => {
        await onUpdateBoard({ background_color: color, background_image: image });
        message.success('Background updated');
    };

    const handleToggleCardCovers = async () => {
        await onUpdateBoard({ show_card_covers: !board.show_card_covers });
        message.success(board.show_card_covers ? 'Card covers hidden' : 'Card covers shown');
    };

    // Main menu screen
    const renderMainScreen = () => (
        <div style={{ width: 280 }}>
            <MenuTitle title="Menu" />

            {/* Section 1 */}
            <MenuItem icon={<ShareAltOutlined />} label="Share" onClick={() => { setOpen(false); onShareClick(); }} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 2: Board info */}
            <MenuItem icon={<InfoCircleOutlined />} label="About this board" onClick={() => setScreen('about')} />
            <MenuItem
                icon={(board as any).visibility === 'public' ? <GlobalOutlined /> : <LockOutlined />}
                label={`Visibility: ${(board as any).visibility === 'public' ? 'Public' : 'Private'}`}
            />
            <MenuItem
                icon={board.is_starred ? <StarFilled style={{ color: '#f5cd47' }} /> : <StarOutlined />}
                label={board.is_starred ? 'Unstar' : 'Star'}
                onClick={onToggleStar}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 3: Settings */}
            <MenuItem icon={<BgColorsOutlined />} label="Change background" onClick={() => setScreen('background')} />
            <MenuItem
                icon={board.show_card_covers ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                label={board.show_card_covers ? 'Hide card covers' : 'Show card covers'}
                onClick={handleToggleCardCovers}
            />
            <MenuItem icon={<TagsOutlined />} label="Labels" onClick={() => message.info('Coming soon')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 4: Archive */}
            <MenuItem icon={<InboxOutlined />} label="Archived items" onClick={() => setScreen('archived')} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 5: Board Actions */}
            <MenuItem
                icon={board.is_watching ? <BellFilled style={{ color: '#1890ff' }} /> : <BellOutlined />}
                label={board.is_watching ? 'Watching' : 'Watch'}
                onClick={onToggleWatch}
            />
            <MenuItem
                icon={<ColumnWidthOutlined />}
                label="Expand all lists"
                onClick={async () => {
                    await onExpandAllLists();
                    message.success('All lists expanded');
                }}
            />
            <MenuItem
                icon={<ColumnWidthOutlined style={{ transform: 'rotate(90deg)' }} />}
                label="Collapse all lists"
                onClick={async () => {
                    await onCollapseAllLists();
                    message.success('All lists collapsed');
                }}
            />
            <MenuItem
                icon={<CopyOutlined />}
                label="Copy board"
                onClick={() => message.info('Copy board coming soon')}
            />
            <MenuItem
                icon={<StopOutlined />}
                label="Close board"
                onClick={() => message.info('Close board coming soon')}
            />

            <Divider style={{ margin: '8px 0' }} />

            {/* Section 6: Delete */}
            <MenuItem icon={<DeleteOutlined />} label="Delete board" onClick={handleDelete} danger />
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
            default:
                return renderMainScreen();
        }
    };

    return (
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
    );
}
