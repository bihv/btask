import { create } from 'zustand';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface LabelState {
    labels: Record<string, string>;
    isLoading: boolean;
    isLoaded: boolean;
    fetchLabels: () => Promise<void>;
    t: (key: string) => string;
    clearCache: () => void;
}

export const useLabelStore = create<LabelState>()((set, get) => ({
    labels: {},
    isLoading: false,
    isLoaded: false,

    fetchLabels: async () => {
        set({ isLoading: true });
        try {
            // Backend automatically returns labels in user's preferred language
            const response = await api.get('/labels');
            set({
                labels: response.data.data || {},
                isLoading: false,
                isLoaded: true,
            });
        } catch (error) {
            console.error('Failed to fetch labels:', error);
            set({ isLoading: false });
        }
    },

    t: (key: string) => {
        const { labels } = get();
        return labels[key] || key; // Fallback to key if not found
    },

    clearCache: () => {
        set({ labels: {}, isLoaded: false });
    },
}));

// Hook for easy access to translation function with auto-loading
export function useLabel() {
    const t = useLabelStore((state) => state.t);
    const isLoaded = useLabelStore((state) => state.isLoaded);
    const isLoading = useLabelStore((state) => state.isLoading);
    const fetchLabels = useLabelStore((state) => state.fetchLabels);

    // Only fetch when user is authenticated
    const isAuthenticated = useAuthStore((state) => !!state.user);

    // Auto-fetch labels when authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoaded && !isLoading) {
            fetchLabels();
        }
    }, [isAuthenticated, isLoaded, isLoading, fetchLabels]);

    return t;
}

// Hook for getting a specific label
export function useLabelValue(key: string) {
    const labels = useLabelStore((state) => state.labels);
    return labels[key] || key;
}
