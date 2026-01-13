'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dropdown, Badge, Button, List, Typography, Spin, Empty, Switch, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';

dayjs.extend(relativeTime);

const { Text } = Typography;

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
                <Text strong>Notifications</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tooltip title="Only show unread">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Switch
                                size="small"
                                checked={unreadOnly}
                                onChange={(checked) => setUnreadOnly(checked)}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>Unread</Text>
                        </div>
                    </Tooltip>
                    {unreadCount > 0 && (
                        <Button
                            type="link"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                        >
                            Mark all read
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
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={unreadOnly ? "No unread notifications" : "No notifications"}
                        style={{ padding: 40 }}
                    />
                ) : (
                    <>
                        <List
                            dataSource={notifications}
                            renderItem={(notification) => (
                                <List.Item
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: notification.is_read ? 'transparent' : 'rgba(24, 144, 255, 0.1)',
                                        borderBottom: '1px solid var(--border-color)',
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
                                                    <Text strong style={{ display: 'block' }}>
                                                        {notification.title}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {notification.message}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                        {dayjs(notification.created_at).fromNow()}
                                                    </Text>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div style={{ width: '100%' }}>
                                                <Text strong style={{ display: 'block' }}>
                                                    {notification.title}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {notification.message}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                    {dayjs(notification.created_at).fromNow()}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                    <Tooltip title={notification.is_read ? 'Mark as unread' : 'Mark as read'}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={notification.is_read ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                            onClick={(e) => handleToggleRead(e, notification)}
                                            style={{
                                                marginLeft: 8,
                                                opacity: 0.6,
                                                flexShrink: 0
                                            }}
                                        />
                                    </Tooltip>
                                </List.Item>
                            )}
                        />
                        {isLoading && (
                            <div style={{ padding: 16, textAlign: 'center' }}>
                                <Spin size="small" />
                            </div>
                        )}
                        {!hasMore && notifications.length > 0 && (
                            <div style={{ padding: 12, textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>No more notifications</Text>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Dropdown
            open={open}
            onOpenChange={handleOpenChange}
            popupRender={() => dropdownContent}
            trigger={['click']}
            placement="bottomRight"
        >
            <Badge count={unreadCount} size="small" offset={[-2, 2]} overflowCount={99}>
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 20 }} />}
                    style={{
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                />
            </Badge>
        </Dropdown>
    );
}
