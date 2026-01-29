'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Webhook {
    id: string;
    callback_url: string;
    events: string[];
    is_active: boolean;
    failure_count: number;
    last_triggered_at?: string;
    last_success_at?: string;
    last_error?: string;
    created_at: string;
}

export interface WebhookDelivery {
    id: string;
    event_type: string;
    status: string;
    response_status?: number;
    response_time_ms?: number;
    attempt_count: number;
    created_at: string;
    next_retry_at?: string;
    payload?: any;
}

export interface CreateWebhookRequest {
    callback_url: string;
    secret: string;
    events: string[];
    board_id?: string;
}

export interface UpdateWebhookRequest {
    callback_url?: string;
    secret?: string;
    events?: string[];
    is_active?: boolean;
}

export const webhookKeys = {
    all: ['webhooks'] as const,
    list: (pluginId: string, installationId: string) => [...webhookKeys.all, 'list', pluginId, installationId] as const,
    deliveries: (webhookId: string) => [...webhookKeys.all, 'deliveries', webhookId] as const,
};

export function useWebhooks(pluginId: string, installationId: string) {
    return useQuery({
        queryKey: webhookKeys.list(pluginId, installationId),
        queryFn: async (): Promise<Webhook[]> => {
            const response = await api.get(`/plugins/${pluginId}/installations/${installationId}/webhooks`);
            return response.data;
        },
        enabled: !!pluginId && !!installationId,
    });
}

export function useWebhookDeliveries(webhookId: string) {
    return useQuery({
        queryKey: webhookKeys.deliveries(webhookId),
        queryFn: async (): Promise<WebhookDelivery[]> => {
            const response = await api.get(`/webhooks/${webhookId}/deliveries`);
            return response.data;
        },
        enabled: !!webhookId,
    });
}

export function useCreateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ pluginId, installationId, data }: { pluginId: string; installationId: string; data: CreateWebhookRequest }): Promise<Webhook> => {
            const response = await api.post(`/plugins/${pluginId}/installations/${installationId}/webhooks`, data);
            return response.data;
        },
        onSuccess: (_, { pluginId, installationId }) => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.list(pluginId, installationId) });
        },
    });
}

export function useUpdateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateWebhookRequest }): Promise<Webhook> => {
            const response = await api.put(`/webhooks/${id}`, data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
        },
    });
}

export function useDeleteWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
        },
    });
}
