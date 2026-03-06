'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import { Notification, useNotificationStore } from '@/stores/notificationStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Indicator, Loader, Popover, Switch, Text, Tooltip } from '@mantine/core';
import { IconBellFilled, IconCheck, IconEye, IconEyeOff } from '@tabler/icons-react';
dayjs.extend(relativeTime);

export default function NotificationDropdown() {
    // Use individual selectors for proper reactivity
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const isLoading = useNotificationStore((state) => state.isLoading);
    const hasMore = useNotificationStore((state) => state.hasMore);
    const unreadOnly = useNotificationStore((state) => state.unreadOnly);
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const fetchMoreNotifications = useNotificationStore((state) => state.fetchMoreNotifications);
    const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const markAsUnread = useNotificationStore((state) => state.markAsUnread);
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
    const setUnreadOnly = useNotificationStore((state) => state.setUnreadOnly);

    const [open, setOpen] = useState(false);
    const t = useTranslation();
    const token = useAppToken();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    const handleOpenChange = (visible: boolean) => {
        setOpen(visible);
        if (visible) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setOpen(false);
    };

    const handleToggleRead = (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        e.preventDefault();
        if (notification.is_read) {
            markAsUnread(notification.id);
        } else {
            markAsRead(notification.id);
        }
    };

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        // Load more when scrolled to bottom (with 50px threshold)
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !isLoading) {
            fetchMoreNotifications();
        }
    }, [hasMore, isLoading, fetchMoreNotifications]);

    const dropdownContent = (
        <div style={{
            width: 380,
            maxHeight: 450,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text fw={700}>{t('UI_NOTIFICATIONS')}</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tooltip label={t('UI_ONLY_UNREAD')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Switch
                                size="sm"
                                checked={unreadOnly}
                                onChange={(e) => setUnreadOnly(e.currentTarget.checked)}
                            />
                            <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_UNREAD')}</Text>
                        </div>
                    </Tooltip>
                    {unreadCount > 0 && (
                        <Button
                            variant="transparent"
                            size="sm"
                            leftSection={<IconCheck size={16} />}
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                        >
                            {t('UI_MARK_ALL_READ')}
                        </Button>
                    )}
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                    overflow: 'auto',
                    flex: 1,
                    maxHeight: 380
                }}
            >
                {notifications.length === 0 && !isLoading ? (
                    <Text c="dimmed" ta="center" py="xl">
                        {unreadOnly ? t('UI_NO_UNREAD_NOTIFICATIONS') : t('UI_NO_NOTIFICATIONS')}
                    </Text>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: notification.is_read ? 'transparent' : 'var(--mantine-primary-color-light)',
                                        display: 'flex',
                                        alignItems: 'flex-start'
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div style={{ flex: 1 }}>
                                        {notification.card_id ? (
                                            <Link
                                                href={`/boards/${notification.board_id}/cards/${notification.card_id}`}
                                                style={{ width: '100%', color: 'inherit' }}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div>
                                                    <Text fw={700} style={{ display: 'block' }}>
                                                        {notification.title}
                                                    </Text>
                                                    <Text c="dimmed" style={{ fontSize: 12 }}>
                                                        {notification.message}
                                                    </Text>
                                                    <Text c="dimmed" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                        {dayjs(notification.created_at).fromNow()}
                                                    </Text>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div style={{ width: '100%' }}>
                                                <Text fw={700} style={{ display: 'block' }}>
                                                    {notification.title}
                                                </Text>
                                                <Text c="dimmed" style={{ fontSize: 12 }}>
                                                    {notification.message}
                                                </Text>
                                                <Text c="dimmed" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                    {dayjs(notification.created_at).fromNow()}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                    <Tooltip label={notification.is_read ? t('UI_MARK_AS_UNREAD') : t('UI_MARK_AS_READ')}>
                                        <Button
                                            variant="subtle"
                                            size="sm"
                                            leftSection={notification.is_read ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                            onClick={(e) => handleToggleRead(e, notification)}
                                            style={{
                                                marginLeft: 8,
                                                opacity: 0.6,
                                                flexShrink: 0
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                        {isLoading && (
                            <div style={{ padding: 16, textAlign: 'center' }}>
                                <Loader size="sm" />
                            </div>
                        )}
                        {!hasMore && notifications.length > 0 && (
                            <div style={{ padding: 12, textAlign: 'center' }}>
                                <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NO_MORE_NOTIFICATIONS')}</Text>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Popover
            opened={open}
            onChange={handleOpenChange}
            position="bottom-end"
            width={380}
        >
            <Popover.Target>
                <Indicator label={unreadCount > 0 ? unreadCount : undefined} size={16} offset={4} disabled={unreadCount === 0}>
                    <Button
                        variant="subtle"
                        leftSection={<IconBellFilled size={20} />}
                        onClick={() => handleOpenChange(!open)}
                        style={{
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                </Indicator>
            </Popover.Target>
            <Popover.Dropdown p={0}>
                {dropdownContent}
            </Popover.Dropdown>
        </Popover>
    );
}
