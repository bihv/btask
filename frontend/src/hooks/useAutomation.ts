import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { message } from 'antd';

export interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    trigger_type: 'event' | 'schedule' | 'manual';
    trigger_config: any;
    actions: any[];
    is_enabled: boolean;
}

export const useBoardRules = (boardId: string) => {
    return useQuery({
        queryKey: ['rules', boardId],
        queryFn: async () => {
            const { data } = await api.get(`/boards/${boardId}/automation/rules`);
            return data.data; // API returns { data: [...] }
        },
        enabled: !!boardId,
    });
};

export const useCreateRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/automation/rules', data),
        onSuccess: () => {
            message.success('Rule created successfully');
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to create rule');
        },
    });
};

export const useDeleteRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/automation/rules/${id}`),
        onSuccess: () => {
            message.success('Rule deleted');
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
};
