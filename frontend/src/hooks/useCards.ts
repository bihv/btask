'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { checklistApi } from '@/lib/api';
import { Card, Comment, Label, User, Checklist } from '@/types';
import { boardKeys } from './useBoards';

// Query Keys
export const cardKeys = {
    detail: (id: string) => ['cards', id] as const,
    comments: (id: string) => ['cards', id, 'comments'] as const,
    checklists: (id: string) => ['cards', id, 'checklists'] as const,
};

// Fetch single card
export function useCard(id: string) {
    return useQuery({
        queryKey: cardKeys.detail(id),
        queryFn: async (): Promise<Card> => {
            const response = await api.get(`/cards/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

// Fetch card comments
export function useCardComments(cardId: string) {
    return useQuery({
        queryKey: cardKeys.comments(cardId),
        queryFn: async (): Promise<Comment[]> => {
            const response = await api.get(`/cards/${cardId}/comments`);
            return response.data.data || [];
        },
        enabled: !!cardId,
    });
}

// Fetch board labels
export function useBoardLabels(boardId: string) {
    return useQuery({
        queryKey: ['boards', boardId, 'labels'],
        queryFn: async (): Promise<Label[]> => {
            const response = await api.get(`/boards/${boardId}/labels`);
            return response.data.data || [];
        },
        enabled: !!boardId,
    });
}

// Fetch workspace members (with role)
export function useWorkspaceMembers(workspaceId: string) {
    return useQuery({
        queryKey: ['workspaces', workspaceId, 'members'],
        queryFn: async (): Promise<(User & { role?: string })[]> => {
            const response = await api.get(`/workspaces/${workspaceId}/members`);
            // Extract users from members response and include role
            const members = response.data.data || [];
            return members.map((m: { user: User; role: string }) => ({
                ...m.user,
                role: m.role
            })).filter(Boolean);
        },
        enabled: !!workspaceId,
    });
}

// Update card mutation
export function useUpdateCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Card> }): Promise<Card> => {
            const response = await api.put(`/cards/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
        },
    });
}

// Delete card mutation
export function useDeleteCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/cards/${id}`);
        },
        onSuccess: () => {
            // Invalidate board queries to refresh card lists
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        },
    });
}

// Add comment mutation
export function useAddComment(cardId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string): Promise<Comment> => {
            const response = await api.post(`/cards/${cardId}/comments`, { content });
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate card detail to refresh comments
            queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
        },
    });
}

// Toggle label mutation
export function useToggleCardLabel(cardId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ labelId, hasLabel }: { labelId: string; hasLabel: boolean }): Promise<void> => {
            if (hasLabel) {
                await api.delete(`/cards/${cardId}/labels/${labelId}`);
            } else {
                await api.post(`/cards/${cardId}/labels`, { label_id: labelId });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        },
    });
}

// Toggle member mutation
export function useToggleCardMember(cardId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, hasMember }: { userId: string; hasMember: boolean }): Promise<void> => {
            if (hasMember) {
                await api.delete(`/cards/${cardId}/members/${userId}`);
            } else {
                await api.post(`/cards/${cardId}/members`, { user_id: userId });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        },
    });
}

// Fetch checklists for a card
export function useChecklists(cardId: string) {
    return useQuery({
        queryKey: cardKeys.checklists(cardId),
        queryFn: async (): Promise<Checklist[]> => {
            const response = await checklistApi.getByCardId(cardId);
            return response.data.data || [];
        },
        enabled: !!cardId,
    });
}

// Invalidate checklists hook
export function useInvalidateChecklists(cardId: string) {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: cardKeys.checklists(cardId) });
}

// Fetch attachments for a card
export function useAttachments(cardId: string) {
    return useQuery({
        queryKey: ['cards', cardId, 'attachments'],
        queryFn: async () => {
            const { attachmentApi } = await import('@/lib/api');
            const response = await attachmentApi.getByCardId(cardId);
            return response.data.data || [];
        },
        enabled: !!cardId,
    });
}
