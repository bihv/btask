'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Typography, Button, Input, Spin, App } from 'antd';
import { MoreOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import {
    KanbanView as KanbanBoard,
    BoardViewSwitcher,
    TableView,
    CalendarView,
    DashboardView,
    type BoardViewMode,
} from '@/components/board/views';
import { useHeader } from '@/providers/HeaderProvider';
import { useBoard, useUpdateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { useWorkspaceMembers } from '@/hooks/useCards';
import CardFilterBar, { FilterState, defaultFilters } from '@/components/board/CardFilterBar';
import ShareModal from '@/components/workspace/ShareModal';
import BoardMenuPopover from '@/components/board/BoardMenuPopover';
import api from '@/lib/api';

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

    const { setHeaderContent } = useHeader();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [shareOpen, setShareOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    
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
            // Also update currentBoard in store for compatibility
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
                message.success('Board title updated');
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
                message.success('Stopped watching board');
            } else {
                await api.post(`/boards/${boardId}/watch`);
                message.success('Now watching board');
            }
            refetch();
        } catch (error) {
            message.error('Failed to update watch status');
        }
    };

    // Set dynamic header
    useEffect(() => {
        if (board) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
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
                            style={{ fontSize: 16, cursor: 'pointer' }}
                            onClick={() => setIsEditing(true)}
                        >
                            {board.title}
                        </Text>
                    )}
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
                        onCopyBoard={async (title) => {
                            const response = await api.post(`/boards/${boardId}/copy`, { title });
                            const newBoard = response.data.data;
                            router.push(`/boards/${newBoard.id}`);
                        }}
                        onUpdateBoard={async (data) => {
                            await updateMutation.mutateAsync({ id: boardId, data });
                        }}
                        onDeleteBoard={async () => {
                            await deleteMutation.mutateAsync(boardId);
                            message.success('Board deleted');
                            router.push('/workspaces');
                        }}
                        onCardClick={(cardId) => router.push(`/boards/${boardId}/cards/${cardId}`)}
                    >
                        <Button type="text" icon={<MoreOutlined />} />
                    </BoardMenuPopover>
                </div>
            );
        }
        return () => setHeaderContent(null);
    }, [board, isEditing, title, workspaceMembers.length]);

    if (isLoading || !board) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
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
            {/* Filter Bar and View Switcher */}
            <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                {viewMode !== 'dashboard' ? (
                    <CardFilterBar
                        labels={board.labels || []}
                        members={workspaceMembers}
                        filters={filters}
                        onChange={setFilters}
                        hideNoDateOption={viewMode === 'calendar'}
                    />
                ) : (
                    <div />
                )}
                <BoardViewSwitcher value={viewMode} onChange={handleViewChange} />
            </div>

            {/* Board Views */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {viewMode === 'board' && <KanbanBoard filters={filters} />}
                {viewMode === 'table' && <TableView filters={filters} onCardClick={handleCardClick} />}
                {viewMode === 'calendar' && <CalendarView filters={filters} onCardClick={handleCardClick} />}
                {viewMode === 'dashboard' && <DashboardView onCardClick={handleCardClick} />}
            </div>

            {/* Share Modal */}
            <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                workspaceId={board.workspace_id}
                isOwner={true}
            />
        </div>
    );
}
