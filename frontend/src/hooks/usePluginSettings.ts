import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hook to get plugin settings for a specific installation
 */
export const useGetPluginSettings = (installationId: string) => {
    return useQuery({
        queryKey: ['plugin-settings', installationId],
        queryFn: async () => {
            if (!installationId) return null;
            const { data } = await api.get(`/plugin-installations/${installationId}/settings`);
            return data;
        },
        enabled: !!installationId,
    });
};

/**
 * Hook to update plugin settings
 */
export const useUpdatePluginSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ installationId, settings }: { installationId: string; settings: any }) => {
            const { data } = await api.put(`/plugin-installations/${installationId}/settings`, { settings });
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['plugin-settings', variables.installationId] });

            // Broadcast event for real-time updates
            window.dispatchEvent(new CustomEvent('plugin:settings:updated', {
                detail: { installationId: variables.installationId }
            }));
        },
    });
};

/**
 * Hook to fetch plugin manifest
 */
export const usePluginManifest = (manifestUrl: string) => {
    return useQuery({
        queryKey: ['plugin-manifest', manifestUrl],
        queryFn: async () => {
            if (!manifestUrl) return null;
            const res = await fetch(manifestUrl);
            return res.json();
        },
        enabled: !!manifestUrl,
    });
};
