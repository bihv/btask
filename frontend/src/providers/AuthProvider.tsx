'use client';

import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState, createContext, useContext } from 'react';

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthLoadingContext = createContext<boolean>(true);

export function AuthProvider({ children }: AuthProviderProps) {
    const { checkAuth } = useAuthStore();
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            await checkAuth();
            setIsAuthLoading(false);
        };

        initAuth();
    }, [checkAuth]);

    return (
        <AuthLoadingContext.Provider value={isAuthLoading}>
            {children}
        </AuthLoadingContext.Provider>
    );
}

export function useAuthLoading() {
    return useContext(AuthLoadingContext);
}
