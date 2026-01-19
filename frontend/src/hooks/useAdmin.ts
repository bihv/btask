'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    is_admin: boolean;
    created_at: string;
}

export interface SystemLabel {
    id: string;
    key: string;
    category: string;
    default_value: string;
    description: string;
    translations: SystemTranslation[];
}

export interface SystemTranslation {
    id: string;
    label_id: string;
    language: string;
    value: string;
}

// Query Keys
export const adminKeys = {
    users: ['admin', 'users'] as const,
    labels: ['admin', 'labels'] as const,
};

// ============ Users ============

export function useAdminUsers() {
    return useQuery({
        queryKey: adminKeys.users,
        queryFn: async (): Promise<AdminUser[]> => {
            const response = await api.get('/admin/users');
            return response.data.data || [];
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
            const response = await api.put(`/admin/users/${userId}/role`, { is_admin: isAdmin });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.users });
        },
    });
}

// ============ Labels ============

export interface LabelsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
}

export interface PaginatedLabelsResponse {
    labels: SystemLabel[];
    total: number;
    page: number;
    limit: number;
}

export function useAdminLabels(params: LabelsQueryParams = {}) {
    const { page = 1, limit = 20, search = '', category = '' } = params;

    return useQuery({
        queryKey: [...adminKeys.labels, { page, limit, search, category }],
        queryFn: async (): Promise<PaginatedLabelsResponse> => {
            const queryParams = new URLSearchParams();
            queryParams.set('page', String(page));
            queryParams.set('limit', String(limit));
            if (search) queryParams.set('search', search);
            if (category) queryParams.set('category', category);

            const response = await api.get(`/admin/labels?${queryParams.toString()}`);
            return response.data.data;
        },
    });
}

export function useCreateLabel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { key: string; category: string; default_value: string; description: string }) => {
            const response = await api.post('/admin/labels', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}

export function useUpdateLabel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { key: string; category: string; default_value: string; description: string } }) => {
            const response = await api.put(`/admin/labels/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}

export function useDeleteLabel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/admin/labels/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}

// ============ Translations ============

export function useCreateTranslation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { label_id: string; language: string; value: string }) => {
            const response = await api.post('/admin/translations', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}

export function useUpdateTranslation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, value }: { id: string; value: string }) => {
            const response = await api.put(`/admin/translations/${id}`, { value });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}

export function useDeleteTranslation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/admin/translations/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.labels });
        },
    });
}
