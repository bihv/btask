'use client';

import { useAuthLoading } from '@/providers/AuthProvider';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loader } from '@mantine/core';
export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const isAuthLoading = useAuthLoading();

    useEffect(() => {
        // Only redirect after auth has been checked
        if (isAuthLoading) return;

        if (isAuthenticated) {
            router.replace('/workspaces');
        } else {
            router.replace('/login');
        }
    }, [isAuthenticated, router, isAuthLoading]);

    return (
        <div className="loading-container" style={{ minHeight: '100vh' }}>
            <Loader size="lg" />
        </div>
    );
}
