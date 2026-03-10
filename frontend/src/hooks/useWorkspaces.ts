'use client';

import api from '@/lib/api';
import { Board, CreateWorkspaceRequest, Workspace } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const workspaceKeys = {
    all: ['workspaces'] as const,
    detail: (id: string) => ['workspaces', id] as const,
    boards: (id: string) => ['workspaces', id, 'boards'] as const,
};

// Fetch all workspaces
export function useWorkspaces() {
    return useQuery({
        queryKey: workspaceKeys.all,
        queryFn: async (): Promise<Workspace[]> => {
            const response = await api.get('/workspaces/');
            return response.data.data || [];
        },
    });
}

// Fetch single workspace
export function useWorkspace(id: string) {
    return useQuery({
        queryKey: workspaceKeys.detail(id),
        queryFn: async (): Promise<Workspace> => {
            const response = await api.get(`/workspaces/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

// Fetch boards for a workspace
export function useWorkspaceBoards(workspaceId: string) {
    return useQuery({
        queryKey: workspaceKeys.boards(workspaceId),
        queryFn: async (): Promise<Board[]> => {
            const response = await api.get(`/workspaces/${workspaceId}/boards`);
            return response.data.data || [];
        },
        enabled: !!workspaceId,
    });
}

// Create workspace mutation
export function useCreateWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
            const response = await api.post('/workspaces/', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
        },
    });
}

// Update workspace mutation
export function useUpdateWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }): Promise<Workspace> => {
            const response = await api.put(`/workspaces/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
            queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
        },
    });
}

// Delete workspace mutation
export function useDeleteWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/workspaces/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
        },
    });
}
