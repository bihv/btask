import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Template {
    id: string;
    title: string;
    author?: string;
    description?: string;
    full_description?: string;
    category?: string;
    cover_color?: string;
    cover_url?: string;
    copies?: number;
    views?: number;
    is_featured?: boolean;
    is_active?: boolean;
    created_at?: string;
    lists?: TemplateList[];
}

export interface TemplateList {
    id: string;
    template_id: string;
    title: string;
    color?: string;
    position: number;
    cards?: TemplateCard[];
}

export interface TemplateCard {
    id: string;
    template_list_id: string;
    title: string;
    description?: string;
    cover_url?: string;
    due_date?: string;
    position: number;
}

interface TemplateListParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    is_featured?: boolean;
}

interface TemplateListResponse {
    templates: Template[];
    total: number;
    page: number;
    limit: number;
}

// Public hooks - for templates gallery
export function useTemplates(params: TemplateListParams = {}) {
    return useQuery<TemplateListResponse>({
        queryKey: ['templates', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params.page) searchParams.set('page', params.page.toString());
            if (params.limit) searchParams.set('limit', params.limit.toString());
            if (params.search) searchParams.set('search', params.search);
            if (params.category) searchParams.set('category', params.category);
            if (params.is_featured) searchParams.set('is_featured', 'true');

            const response = await api.get(`/templates?${searchParams.toString()}`);
            return response.data.data;
        },
    });
}

export function useTemplate(id: string) {
    return useQuery<Template>({
        queryKey: ['templates', id],
        queryFn: async () => {
            const response = await api.get(`/templates/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

// Admin hooks
export function useAdminTemplates(params: TemplateListParams = {}) {
    return useQuery<TemplateListResponse>({
        queryKey: ['admin', 'templates', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params.page) searchParams.set('page', params.page.toString());
            if (params.limit) searchParams.set('limit', params.limit.toString());
            if (params.search) searchParams.set('search', params.search);
            if (params.category) searchParams.set('category', params.category);

            const response = await api.get(`/admin/templates?${searchParams.toString()}`);
            return response.data.data;
        },
    });
}

interface CreateTemplateInput {
    title: string;
    author?: string;
    description?: string;
    full_description?: string;
    category?: string;
    cover_color?: string;
    cover_url?: string;
    is_featured?: boolean;
    lists?: {
        title: string;
        color?: string;
        position?: number;
        cards?: { title: string; description?: string; cover_url?: string; due_date?: string; position?: number }[];
    }[];
}

interface UpdateTemplateInput {
    title?: string;
    author?: string;
    description?: string;
    full_description?: string;
    category?: string;
    cover_color?: string;
    cover_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTemplateInput) => {
            const response = await api.post('/admin/templates', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateInput }) => {
            const response = await api.put(`/admin/templates/${id}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useUpdateTemplateLists() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, lists }: { id: string; lists: CreateTemplateInput['lists'] }) => {
            const response = await api.put(`/admin/templates/${id}/lists`, { lists });
            return response.data.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
            queryClient.invalidateQueries({ queryKey: ['templates', id] });
        },
    });
}

export function useIncrementTemplateCopies() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/templates/${id}/copy`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}
