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
