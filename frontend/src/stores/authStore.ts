import api, { sessionApi, Session } from '@/lib/api';
import { User } from '@/types';
import { create } from 'zustand';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessions: Session[];
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    checkAuth: () => Promise<void>;
    fetchSessions: () => Promise<void>;
    revokeSession: (sessionId: string) => Promise<void>;
    revokeAllOtherSessions: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessions: [],

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user } = response.data.data;

                    set({ user, isAuthenticated: true, isLoading: false });
                    
                    // Fetch sessions after login
                    get().fetchSessions();
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (email: string, password: string, fullName: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', {
                        email,
                        password,
                        full_name: fullName,
                    });
                    const { user } = response.data.data;

                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    // Continue with logout even if API fails
                }
                set({ user: null, isAuthenticated: false, sessions: [] });
            },

            setUser: (user: User) => {
                set({ user });
            },

            // Check if user is authenticated (by calling /users/me)
            checkAuth: async () => {
                try {
                    const response = await api.get('/users/me');
                    set({ user: response.data.data, isAuthenticated: true });
                    
                    // Fetch sessions when checking auth
                    get().fetchSessions();
                } catch (error) {
                    set({ user: null, isAuthenticated: false, sessions: [] });
                }
            },

            fetchSessions: async () => {
                try {
                    const sessions = await sessionApi.getSessions();
                    set({ sessions });
                } catch (error) {
                    console.error('Failed to fetch sessions:', error);
                    set({ sessions: [] });
                }
            },

            revokeSession: async (sessionId: string) => {
                try {
                    await sessionApi.revokeSession(sessionId);
                    // Update sessions list
                    const sessions = get().sessions.filter(s => s.id !== sessionId);
                    set({ sessions });
                } catch (error) {
                    console.error('Failed to revoke session:', error);
                    throw error;
                }
            },

            revokeAllOtherSessions: async () => {
                try {
                    await sessionApi.revokeAllSessions();
                    // Clear sessions and logout user
                    set({ sessions: [], user: null, isAuthenticated: false });
                } catch (error) {
                    console.error('Failed to revoke all sessions:', error);
                    throw error;
                }
            },
        })
);
