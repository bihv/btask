'use client';

import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface UserSuggestion {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
}

// Query Keys
export const userKeys = {
    all: ['users'] as const,
    suggest: (query: string) => ['users', 'suggest', query] as const,
};

// Search users for autocomplete suggestions
export function useUserSuggest(query: string, enabled = true) {
    return useQuery({
        queryKey: userKeys.suggest(query),
        queryFn: async (): Promise<UserSuggestion[]> => {
            if (query.length < 2) return [];
            const response = await api.get(`/users/suggest?q=${encodeURIComponent(query)}`);
            return response.data.data || [];
        },
        enabled: enabled && query.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
    });
}
