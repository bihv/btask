'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppToken } from '@/hooks/useAppToken';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AutomationModal from '@/components/board/automation/AutomationModal';
import { useBoardStore } from '@/stores/boardStore';
import { Text, Title, Button, TextInput, Loader, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDots, IconArrowLeft, IconStar, IconStarFilled, IconShare, IconFilter, IconBolt, IconRobot } from '@tabler/icons-react';
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
import { Label } from '@/types';
import ShareModal from '@/components/workspace/ShareModal';
import BoardMenuPopover from '@/components/board/BoardMenuPopover';
import api from '@/lib/api';
import { PluginProvider } from '@/components/plugins';
import BoardPluginsModal from '@/components/board/plugins/BoardPluginsModal';

export default function BoardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const token = useAppToken();

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
                notifications.show({ title: 'Error', message: 'Failed to update title', color: 'red' });
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
            notifications.show({ title: 'Error', message: 'Failed to update board', color: 'red' });
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
            notifications.show({ title: 'Error', message: 'Failed to update watch status', color: 'red' });
        }
    };

    // Compute labels actually in use on non-archived cards
    const activeLabels = useMemo(() => {
        if (!board) return [];
        const labelMap = new Map<string, Label>();
        (board.lists || []).forEach(list => {
            (list.cards || []).forEach(card => {
                if (!card.is_archived) {
                    (card.labels || []).forEach(cl => {
                        if (cl.label && !labelMap.has(cl.label_id)) {
                            labelMap.set(cl.label_id, cl.label);
                        }
                    });
                }
            });
        });
        return Array.from(labelMap.values());
    }, [board?.lists]);

    if (isLoading || !board) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Loader size="lg" />
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
                        : board.background_color || token.colorTemplateCover,
                }}
            >
                {/* Row 2: Board Toolbar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        background: token.colorOverlayDark,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Left: Back + Board Name + View Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => router.back()}
                            style={{ color: token.colorWhite }}
                        />
                        {isEditing ? (
                            <TextInput
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => { if (e.key === "Enter") handleTitleSave(); }}
                                autoFocus
                                style={{
                                    width: 200,
                                    fontWeight: 700,
                                    fontSize: 16,
                                }}
                            />
                        ) : (
                            <Text
                                fw={700}
                                style={{ fontSize: 16, cursor: 'pointer', color: token.colorWhite }}
                                onClick={() => setIsEditing(true)}
                            >
                                {board.title}
                            </Text>
                        )}
                        <BoardViewSwitcher value={viewMode} onChange={handleViewChange} />
                    </div>

                    {/* Right: Placeholders + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tooltip label="Plugins & Power-Ups">
                            <Button
                                variant="subtle"
                                leftSection={<IconBolt size={16} />}
                                onClick={() => setPluginsModalOpen(true)}
                                style={{ color: token.colorWhite }}
                            />
                        </Tooltip>
                        <Tooltip label="Automation">
                            <Button
                                variant="subtle"
                                leftSection={<IconRobot size={16} />}
                                onClick={() => setAutomationModalOpen(true)}
                                style={{ color: token.colorWhite }}
                            />
                        </Tooltip>

                        {/* Filter button */}
                        {viewMode !== 'dashboard' && (
                            <BoardFilterPopover
                                labels={activeLabels}
                                members={workspaceMembers}
                                filters={filters}
                                onChange={setFilters}
                                hideNoDateOption={viewMode === 'calendar'}
                            >
                                <Tooltip label="Filter cards">
                                    <Button
                                        variant={hasActiveFilters(filters) ? "filled" : "subtle"}
                                        leftSection={<IconFilter size={16} />}
                                        style={!hasActiveFilters(filters) ? { color: token.colorWhite } : {}}
                                    >
                                        {hasActiveFilters(filters) ? 'Filters' : 'Filter'}
                                    </Button>
                                </Tooltip>
                            </BoardFilterPopover>
                        )}

                        {/* Star */}
                        <Tooltip label={board.is_starred ? 'Unstar' : 'Star'}>
                            <Button
                                variant="subtle"
                                leftSection={board.is_starred ? <IconStarFilled size={16} style={{ color: token.colorStarYellow }} /> : <IconStar size={16} />}
                                onClick={toggleStar}
                                style={{ color: token.colorWhite }}
                            />
                        </Tooltip>

                        {/* Share */}
                        <Button
                            variant="subtle"
                            leftSection={<IconShare size={16} />}
                            onClick={() => setShareOpen(true)}
                            style={{ color: token.colorWhite }}
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
                            <Button variant="subtle" leftSection={<IconDots size={16} />} style={{ color: token.colorWhite }} />
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
                    boardId={boardId}
                    type="board"
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
