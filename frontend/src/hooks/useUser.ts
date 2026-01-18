'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface UpdateUserRequest {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    const { setUser, user } = useAuthStore();

    return useMutation({
        mutationFn: async (data: UpdateUserRequest): Promise<User> => {
            const response = await api.put(`/users/${user?.id}`, data);
            return response.data.data;
        },
        onSuccess: (updatedUser) => {
            // Update user in auth store
            setUser(updatedUser);
            // Invalidate any user-related queries
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

// Settings hooks

interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

export function useChangePassword() {
    return useMutation({
        mutationFn: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
            const response = await api.put('/users/me/password', data);
            return response.data.data;
        },
    });
}

interface ChangeEmailRequest {
    new_email: string;
    password: string;
}

export function useChangeEmail() {
    return useMutation({
        mutationFn: async (data: ChangeEmailRequest): Promise<{ message: string }> => {
            const response = await api.put('/users/me/email', data);
            return response.data.data;
        },
    });
}

interface UpdatePreferencesRequest {
    notify_card_assigned?: boolean;
    notify_due_date?: boolean;
    notify_comment?: boolean;
    notify_mention?: boolean;
    language?: string;
    timezone?: string;
    date_format?: string;
}

export function useUpdatePreferences() {
    const { setUser } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdatePreferencesRequest): Promise<User> => {
            const response = await api.put('/users/me/preferences', data);
            return response.data.data;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

interface DeleteAccountRequest {
    password: string;
}

export function useDeleteAccount() {
    const { logout } = useAuthStore();

    return useMutation({
        mutationFn: async (data: DeleteAccountRequest): Promise<{ message: string }> => {
            const response = await api.delete('/users/me', { data });
            return response.data.data;
        },
        onSuccess: () => {
            logout();
        },
    });
}

