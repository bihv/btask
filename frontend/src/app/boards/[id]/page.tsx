'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Typography, Button, Input, Spin, App, Tooltip } from 'antd';
import AutomationModal from '@/components/board/automation/AutomationModal';
import {
    MoreOutlined,
    ArrowLeftOutlined,
    StarOutlined,
    StarFilled,
    ShareAltOutlined,
    FilterOutlined,
    ThunderboltOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import {
    KanbanView as KanbanBoard,
    BoardViewSwitcher,
    TableView,
    CalendarView,
    DashboardView,
    type BoardViewMode,
} from '@/components/board/views';
import { useBoard, useUpdateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { useWorkspaceMembers } from '@/hooks/useCards';
import BoardFilterPopover, { FilterState, defaultFilters, hasActiveFilters } from '@/components/board/BoardFilterPopover';
import ShareModal from '@/components/workspace/ShareModal';
import BoardMenuPopover from '@/components/board/BoardMenuPopover';
import api from '@/lib/api';
import { PluginProvider } from '@/components/plugins';
import BoardPluginsModal from '@/components/board/plugins/BoardPluginsModal';

const { Text } = Typography;

export default function BoardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const { message } = App.useApp();

    // React Query for fetching board data
    const { data: board, isLoading, refetch } = useBoard(boardId);

    // Zustand store for list/card operations (used by KanbanBoard)
    const { setLists } = useBoardStore();

    // Mutations
    const updateMutation = useUpdateBoard();
    const deleteMutation = useDeleteBoard();

    // Fetch workspace members for filter
    const { data: workspaceMembers = [] } = useWorkspaceMembers(board?.workspace_id || '');

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [shareOpen, setShareOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    const [showFilters, setShowFilters] = useState(false);
    const [pluginsModalOpen, setPluginsModalOpen] = useState(false);
    const [automationModalOpen, setAutomationModalOpen] = useState(false);

    // View mode from URL query param
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view') as BoardViewMode | null;
    const [viewMode, setViewMode] = useState<BoardViewMode>(viewParam || 'board');

    const handleViewChange = (mode: BoardViewMode) => {
        setViewMode(mode);
        const url = new URL(window.location.href);
        if (mode === 'board') {
            url.searchParams.delete('view');
        } else {
            url.searchParams.set('view', mode);
        }
        router.replace(url.pathname + url.search);
    };

    const handleCardClick = (cardId: string) => {
        router.push(`/boards/${boardId}/cards/${cardId}`);
    };

    // Sync React Query data to Zustand store for KanbanBoard
    useEffect(() => {
        if (board) {
            setLists(board.lists || []);
            useBoardStore.setState({
                currentBoard: board,
                showCardCovers: board.show_card_covers ?? true,
            });
        }
    }, [board, setLists]);

    useEffect(() => {
        if (board) {
            setTitle(board.title);
        }
    }, [board]);

    const handleTitleSave = async () => {
        if (title.trim() && title !== board?.title) {
            try {
                await updateMutation.mutateAsync({ id: boardId, data: { title: title.trim() } });
                refetch();
            } catch (error) {
                message.error('Failed to update title');
                setTitle(board?.title || '');
            }
        }
        setIsEditing(false);
    };

    const toggleStar = async () => {
        if (!board) return;
        try {
            await updateMutation.mutateAsync({
                id: boardId,
                data: { is_starred: !board.is_starred }
            });
        } catch (error) {
            message.error('Failed to update board');
        }
    };

    const toggleWatch = async () => {
        if (!board) return;
        try {
            if (board.is_watching) {
                await api.delete(`/boards/${boardId}/watch`);
            } else {
                await api.post(`/boards/${boardId}/watch`);
            }
            refetch();
        } catch (error) {
            message.error('Failed to update watch status');
        }
    };

    if (isLoading || !board) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <PluginProvider boardId={boardId} boardName={board.title}>
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: board.background_image
                        ? `url(${board.background_image}) center/cover fixed`
                        : board.background_color || '#0079bf',
                }}
            >
                {/* Row 2: Board Toolbar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Left: Back + Board Name + View Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.back()}
                            style={{ color: 'white' }}
                        />
                        {isEditing ? (
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onPressEnter={handleTitleSave}
                                autoFocus
                                style={{
                                    width: 200,
                                    fontWeight: 700,
                                    fontSize: 16,
                                }}
                            />
                        ) : (
                            <Text
                                strong
                                style={{ fontSize: 16, cursor: 'pointer', color: 'white' }}
                                onClick={() => setIsEditing(true)}
                            >
                                {board.title}
                            </Text>
                        )}
                        <BoardViewSwitcher value={viewMode} onChange={handleViewChange} />
                    </div>

                    {/* Right: Placeholders + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tooltip title="Plugins & Power-Ups">
                            <Button
                                type="text"
                                icon={<ThunderboltOutlined />}
                                onClick={() => setPluginsModalOpen(true)}
                                style={{ color: 'white' }}
                            />
                        </Tooltip>
                        <Tooltip title="Automation">
                            <Button
                                type="text"
                                icon={<RobotOutlined />}
                                onClick={() => setAutomationModalOpen(true)}
                                style={{ color: 'white' }}
                            />
                        </Tooltip>

                        {/* Filter button */}
                        {viewMode !== 'dashboard' && (
                            <BoardFilterPopover
                                labels={board.labels || []}
                                members={workspaceMembers}
                                filters={filters}
                                onChange={setFilters}
                                hideNoDateOption={viewMode === 'calendar'}
                            >
                                <Tooltip title="Filter cards">
                                    <Button
                                        type={hasActiveFilters(filters) ? 'primary' : 'text'}
                                        icon={<FilterOutlined />}
                                        style={!hasActiveFilters(filters) ? { color: 'white' } : {}}
                                    >
                                        {hasActiveFilters(filters) ? 'Filters' : 'Filter'}
                                    </Button>
                                </Tooltip>
                            </BoardFilterPopover>
                        )}

                        {/* Star */}
                        <Tooltip title={board.is_starred ? 'Unstar' : 'Star'}>
                            <Button
                                type="text"
                                icon={board.is_starred ? <StarFilled style={{ color: '#f5c542' }} /> : <StarOutlined />}
                                onClick={toggleStar}
                                style={{ color: 'white' }}
                            />
                        </Tooltip>

                        {/* Share */}
                        <Button
                            type="text"
                            icon={<ShareAltOutlined />}
                            onClick={() => setShareOpen(true)}
                            style={{ color: 'white' }}
                        >
                            Share
                        </Button>

                        {/* Menu */}
                        <BoardMenuPopover
                            board={board}
                            workspaceMembers={workspaceMembers}
                            onShareClick={() => setShareOpen(true)}
                            onToggleStar={toggleStar}
                            onToggleWatch={toggleWatch}
                            onExpandAllLists={async () => {
                                await api.put(`/boards/${boardId}/expand-all-lists`);
                                refetch();
                            }}
                            onCollapseAllLists={async () => {
                                await api.put(`/boards/${boardId}/collapse-all-lists`);
                                refetch();
                            }}
                            onCopyBoard={async (copyTitle) => {
                                const response = await api.post(`/boards/${boardId}/copy`, { title: copyTitle });
                                const newBoard = response.data.data;
                                router.push(`/boards/${newBoard.id}`);
                            }}
                            onUpdateBoard={async (data) => {
                                await updateMutation.mutateAsync({ id: boardId, data });
                            }}
                            onDeleteBoard={async () => {
                                await deleteMutation.mutateAsync(boardId);
                                router.push('/workspaces');
                            }}
                            onCardClick={(cardId) => router.push(`/boards/${boardId}/cards/${cardId}`)}
                        >
                            <Button type="text" icon={<MoreOutlined />} style={{ color: 'white' }} />
                        </BoardMenuPopover>
                    </div>
                </div>



                {/* Board Views */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {viewMode === 'board' && <KanbanBoard filters={filters} />}
                    {viewMode === 'table' && <TableView filters={filters} onCardClick={handleCardClick} />}
                    {viewMode === 'calendar' && <CalendarView filters={filters} onCardClick={handleCardClick} />}
                    {viewMode === 'dashboard' && <DashboardView onCardClick={handleCardClick} />}
                </div>

                <ShareModal
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    workspaceId={board.workspace_id}
                    isOwner={true}
                />

                <BoardPluginsModal
                    open={pluginsModalOpen}
                    onClose={() => setPluginsModalOpen(false)}
                    boardId={boardId}
                    workspaceId={board.workspace_id}
                />

                <AutomationModal
                    open={automationModalOpen}
                    onClose={() => setAutomationModalOpen(false)}
                    boardId={boardId}
                />
            </div>
        </PluginProvider>
    );
}
