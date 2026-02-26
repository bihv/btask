'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Query Keys
export const labelKeys = {
    all: ['labels'] as const,
};

// Fetch labels - returns a map of key -> translated value
async function fetchLabels(): Promise<Record<string, string>> {
    const response = await api.get('/labels');
    return response.data.data || {};
}

// Main hook for fetching labels
export function useLabels() {
    return useQuery({
        queryKey: labelKeys.all,
        queryFn: fetchLabels,
        staleTime: 5 * 60 * 1000, // 5 minutes - labels don't change often
        gcTime: 30 * 60 * 1000, // 30 minutes cache
    });
}

// Hook for getting translation function
export function useTranslation() {
    const { data: labels = {} } = useLabels();

    const t = (key: string): string => {
        return labels[key] || key;
    };

    return t;
}

// Hook to invalidate and refetch labels cache (used when language changes)
// Returns a function that also provides getLabel() to get fresh labels after refetch
export function useInvalidateLabels() {
    const queryClient = useQueryClient();

    return async () => {
        await queryClient.invalidateQueries({ queryKey: labelKeys.all });
        // Wait for the refetch to complete
        await queryClient.refetchQueries({ queryKey: labelKeys.all });

        // Return a function to get fresh label from cache
        const freshLabels = queryClient.getQueryData<Record<string, string>>(labelKeys.all) || {};
        return (key: string) => freshLabels[key] || key;
    };
}
