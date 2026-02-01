'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Board, CreateBoardRequest } from '@/types';

// Query Keys
export const boardKeys = {
    all: ['boards'] as const,
    starred: ['boards', 'starred'] as const,
    recentlyViewed: ['boards', 'recentlyViewed'] as const,
    detail: (id: string) => ['boards', id] as const,
};

// Fetch single board with lists and cards
export function useBoard(id: string) {
    return useQuery({
        queryKey: boardKeys.detail(id),
        queryFn: async (): Promise<Board> => {
            const response = await api.get(`/boards/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

// Fetch recently viewed boards for the current user
export function useRecentlyViewedBoards(limit: number = 4) {
    return useQuery({
        queryKey: boardKeys.recentlyViewed,
        queryFn: async (): Promise<Board[]> => {
            const response = await api.get(`/boards/recently-viewed?limit=${limit}`);
            return response.data.data || [];
        },
    });
}

// Fetch all starred boards across all workspaces
export function useStarredBoards() {
    return useQuery({
        queryKey: boardKeys.starred,
        queryFn: async (): Promise<Board[]> => {
            // First fetch all workspaces
            const wsResponse = await api.get('/workspaces/');
            const workspaces = wsResponse.data.data || [];

            // Then fetch boards for each workspace and filter starred
            const allBoards: Board[] = [];
            await Promise.all(
                workspaces.map(async (ws: { id: string }) => {
                    try {
                        const boardsRes = await api.get(`/workspaces/${ws.id}/boards`);
                        const boards = boardsRes.data.data || [];
                        allBoards.push(...boards.filter((b: Board) => b.is_starred));
                    } catch {
                        // Ignore errors for individual workspaces
                    }
                })
            );

            return allBoards;
        },
    });
}

// Fetch all boards across all workspaces
export function useAllBoards() {
    return useQuery({
        queryKey: boardKeys.all,
        queryFn: async (): Promise<Board[]> => {
            // First fetch all workspaces
            const wsResponse = await api.get('/workspaces/');
            const workspaces = wsResponse.data.data || [];

            // Then fetch boards for each workspace
            const allBoards: Board[] = [];
            await Promise.all(
                workspaces.map(async (ws: { id: string }) => {
                    try {
                        const boardsRes = await api.get(`/workspaces/${ws.id}/boards`);
                        const boards = boardsRes.data.data || [];
                        allBoards.push(...boards);
                    } catch {
                        // Ignore errors
                    }
                })
            );

            return allBoards;
        },
    });
}

// Create board mutation
export function useCreateBoard(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBoardRequest): Promise<Board> => {
            const response = await api.post(`/workspaces/${workspaceId}/boards`, data);
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate workspace detail (which includes boards)
            queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

// Update board mutation
export function useUpdateBoard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Board> }): Promise<Board> => {
            const response = await api.put(`/boards/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: boardKeys.starred });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

// Delete board mutation
export function useDeleteBoard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/boards/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            queryClient.invalidateQueries({ queryKey: boardKeys.starred });
        },
    });
}
