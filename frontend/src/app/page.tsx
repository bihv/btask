'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Spin } from 'antd';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/workspaces');
        } else {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    return (
        <div className="loading-container" style={{ minHeight: '100vh' }}>
            <Spin size="large" />
        </div>
    );
}
