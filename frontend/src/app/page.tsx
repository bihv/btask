'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loader } from '@mantine/core';
export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, isLoadingAuth } = useAuthStore();

    useEffect(() => {
        // Wait until auth check is done
        if (isLoadingAuth) return;

        if (isAuthenticated) {
            router.replace('/workspaces');
        } else {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoadingAuth, router]);

    return (
        <div className="loading-container" style={{ minHeight: '100vh' }}>
            <Loader size="lg" />
        </div>
    );
}
