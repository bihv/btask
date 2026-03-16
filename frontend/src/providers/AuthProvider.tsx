'use client';

import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check auth on mount
        checkAuth();
    }, []);

    // Prevent flash of loading state
    if (!mounted) {
        return null;
    }

    return <>{children}</>;
}
