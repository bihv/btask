'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Plugin, CreatePluginRequest, UpdatePluginRequest, PluginStatus } from '@/types';

// Query Keys
export const pluginKeys = {
    all: ['plugins'] as const,
    list: (status?: string) => [...pluginKeys.all, 'list', { status }] as const,
    my: ['my-plugins'] as const,
    admin: (params: PluginsQueryParams) => [...pluginKeys.all, 'admin', params] as const,
    detail: (id: string) => [...pluginKeys.all, 'detail', id] as const,
    bySlug: (slug: string) => [...pluginKeys.all, 'slug', slug] as const,
};

export interface PluginsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: PluginStatus | 'all';
}

export interface PaginatedPluginsResponse {
    plugins: Plugin[];
    total: number;
    page: number;
    limit: number;
}

// ============ Public Plugins (Marketplace) ============

export function usePlugins() {
    return useQuery({
        queryKey: pluginKeys.list('published'),
        queryFn: async (): Promise<Plugin[]> => {
            const response = await api.get('/plugins');
            return response.data || [];
        },
    });
}

// ============ My Plugins (Developer) ============

export function useMyPlugins() {
    return useQuery({
        queryKey: pluginKeys.my,
        queryFn: async (): Promise<Plugin[]> => {
            const response = await api.get('/plugins/my');
            return response.data || [];
        },
    });
}

// ============ Admin Plugins ============

export function useAdminPlugins(params: PluginsQueryParams = {}) {
    const { page = 1, limit = 20, search = '', status = 'all' } = params;

    return useQuery({
        queryKey: pluginKeys.admin(params),
        queryFn: async (): Promise<PaginatedPluginsResponse> => {
            const queryParams = new URLSearchParams();
            queryParams.set('page', String(page));
            queryParams.set('limit', String(limit));
            if (search) queryParams.set('search', search);
            if (status && status !== 'all') queryParams.set('status', status);

            const response = await api.get(`/admin/plugins?${queryParams.toString()}`);
            return response.data.data || { plugins: [], total: 0, page: 1, limit: 20 };
        },
    });
}

// ============ Plugin by Slug ============

export function usePluginBySlug(slug: string) {
    return useQuery({
        queryKey: pluginKeys.bySlug(slug),
        queryFn: async (): Promise<Plugin | null> => {
            const response = await api.get(`/plugins/${slug}`);
            return response.data || null;
        },
        enabled: !!slug,
    });
}

// ============ Mutations ============

export function useCreatePlugin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePluginRequest): Promise<Plugin> => {
            const response = await api.post('/plugins', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
            queryClient.invalidateQueries({ queryKey: pluginKeys.my });
        },
    });
}

export function useUpdatePlugin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdatePluginRequest }): Promise<Plugin> => {
            const response = await api.put(`/plugins/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
            queryClient.invalidateQueries({ queryKey: pluginKeys.my });
        },
    });
}

export function useDeletePlugin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/plugins/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
            queryClient.invalidateQueries({ queryKey: pluginKeys.my });
        },
    });
}

// ============ Admin Update Status ============

export function useUpdatePluginStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: PluginStatus }): Promise<Plugin> => {
            const response = await api.put(`/plugins/${id}`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
        },
    });
}

// ============ Admin Hard Delete Plugin ============

export function useHardDeletePlugin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/admin/plugins/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
        },
    });
}

// ============ Upload Plugin Bundle ============

export interface PluginUploadResponse {
    manifest_url: string;
    client_url: string;
    styles_url?: string;
    message: string;
}

export function useUploadPluginBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }): Promise<PluginUploadResponse> => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/plugins/${id}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pluginKeys.all });
            queryClient.invalidateQueries({ queryKey: pluginKeys.my });
        },
    });
}

// ============ Workspace Plugins ============

export const workspacePluginKeys = {
    all: (workspaceId: string) => ['workspace-plugins', workspaceId] as const,
};

// Get all published plugins (for marketplace)
export function usePublishedPlugins() {
    return useQuery({
        queryKey: ['published-plugins'],
        queryFn: async (): Promise<Plugin[]> => {
            const response = await api.get('/plugins?status=published');
            return response.data?.data || response.data || [];
        },
    });
}

// Get plugins installed in a workspace
export function useWorkspacePlugins(workspaceId: string) {
    return useQuery({
        queryKey: workspacePluginKeys.all(workspaceId),
        queryFn: async (): Promise<import('@/types').PluginInstallation[]> => {
            const response = await api.get(`/workspaces/${workspaceId}/plugins`);
            return response.data?.data || response.data || [];
        },
        enabled: !!workspaceId,
    });
}

// Install plugin to workspace
export function useInstallPluginToWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ workspaceId, slug }: { workspaceId: string; slug: string }): Promise<void> => {
            await api.post(`/workspaces/${workspaceId}/plugins/${slug}/install`);
        },
        onSuccess: (_, { workspaceId }) => {
            queryClient.invalidateQueries({ queryKey: workspacePluginKeys.all(workspaceId) });
        },
    });
}

// Uninstall plugin from workspace
export function useUninstallPluginFromWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ workspaceId, slug }: { workspaceId: string; slug: string }): Promise<void> => {
            await api.delete(`/workspaces/${workspaceId}/plugins/${slug}/uninstall`);
        },
        onSuccess: (_, { workspaceId }) => {
            queryClient.invalidateQueries({ queryKey: workspacePluginKeys.all(workspaceId) });
        },
    });
}
