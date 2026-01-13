import { create } from 'zustand';
import api from '@/lib/api';

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    board_id: string;
    list_id?: string;
    card_id?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    offset: number;

    fetchNotifications: () => Promise<void>;
    fetchMoreNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    resetNotifications: () => void;
}

const LIMIT = 20;

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
    offset: 0,

    fetchNotifications: async () => {
        set({ isLoading: true, offset: 0 });
        try {
            const response = await api.get(`/notifications/?limit=${LIMIT}&offset=0`);
            const data = response.data.data;
            set({
                notifications: data?.notifications || [],
                hasMore: data?.has_more || false,
                offset: LIMIT,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchMoreNotifications: async () => {
        const { isLoading, hasMore, offset } = get();
        if (isLoading || !hasMore) return;

        set({ isLoading: true });
        try {
            const response = await api.get(`/notifications/?limit=${LIMIT}&offset=${offset}`);
            const data = response.data.data;
            set((state) => ({
                notifications: [...state.notifications, ...(data?.notifications || [])],
                hasMore: data?.has_more || false,
                offset: state.offset + LIMIT,
                isLoading: false
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            set({ unreadCount: response.data.data?.count || 0 });
        } catch (error) {
            // Ignore
        }
    },

    markAsRead: async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            set((state) => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            // Ignore
        }
    },

    markAllAsRead: async () => {
        try {
            await api.put('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            }));
        } catch (error) {
            // Ignore
        }
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    },

    resetNotifications: () => {
        set({ notifications: [], offset: 0, hasMore: true });
    }
}));
