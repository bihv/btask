'use client';

import { useEffect, useRef, useCallback } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { labelKeys } from '@/hooks/useLabels';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

export function useWebSocket(token: string | null) {
    const wsRef = useRef<ReconnectingWebSocket | null>(null);
    const queryClient = useQueryClient();

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

