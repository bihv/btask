'use client';

import api from '@/lib/api';
import { labelKeys } from '@/hooks/useLabels';
import { Notification, useNotificationStore } from '@/stores/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

// Helper to get token from cookie
function getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/auth_token=([^;]+)/);
    return match ? match[1] : null;
}

export function useWebSocket() {
    const wsRef = useRef<ReconnectingWebSocket | null>(null);
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(null);

    // Fetch token from API on mount
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await api.get('/users/me');
                // Get token from cookie after successful auth
                const cookieToken = getTokenFromCookie();
                setToken(cookieToken);
            } catch (error) {
                // Not authenticated
                setToken(null);
            }
        };
        fetchToken();
    }, []);

    const connect = useCallback(() => {
        if (!token || wsRef.current) return;

        const wsUrl = `${WS_URL}?token=${token}`;

        wsRef.current = new ReconnectingWebSocket(wsUrl, [], {
            connectionTimeout: 5000,
            maxReconnectionDelay: 10000,
            minReconnectionDelay: 1000,
            maxRetries: 10,
        });

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket message received:', message);

                if (message.type === 'notification') {
                    // Use getState() to always get fresh store actions
                    useNotificationStore.getState().addNotification(message.data as Notification);
                    console.log('Notification added, new count:', useNotificationStore.getState().unreadCount);
                }

                // Handle labels update broadcast
                if (message.type === 'broadcast' && message.data?.type === 'LABELS_UPDATED') {
                    console.log('Labels updated, refreshing...');
                    queryClient.invalidateQueries({ queryKey: labelKeys.all });
                }

                // Handle automation invalidation - refetch board and card data
                if (message.type === 'invalidate') {
                    const data = message.data;
                    console.log('Automation invalidation received:', data);

                    if (data.board_id) {
                        // Invalidate board queries
                        queryClient.invalidateQueries({ queryKey: ['board', data.board_id] });
                        queryClient.invalidateQueries({ queryKey: ['boards'] });

                        // Invalidate automation rules for this board
                        queryClient.invalidateQueries({ queryKey: ['automation', 'rules', data.board_id] });
                    }

                    if (data.card_id) {
                        // Invalidate card queries
                        queryClient.invalidateQueries({ queryKey: ['card', data.card_id] });
                        queryClient.invalidateQueries({ queryKey: ['cards'] });
                    }

                    // Also invalidate list queries since cards may have moved
                    if (data.board_id) {
                        queryClient.invalidateQueries({ queryKey: ['lists', data.board_id] });
                    }
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [token, queryClient]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { disconnect };
}

