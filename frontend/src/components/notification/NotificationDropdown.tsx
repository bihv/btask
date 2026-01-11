'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Button, List, Typography, Spin, Empty } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
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
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

    const [open, setOpen] = useState(false);

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

    const dropdownContent = (
        <div style={{
            width: 360,
            maxHeight: 400,
            overflow: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text strong>Notifications</Text>
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
                        Mark all as read
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <Spin />
                </div>
            ) : notifications.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No notifications"
                    style={{ padding: 40 }}
                />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(notification) => (
                        <List.Item
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                background: notification.is_read ? 'transparent' : 'rgba(24, 144, 255, 0.1)',
                                borderBottom: '1px solid var(--border-color)'
                            }}
                            onClick={() => handleNotificationClick(notification)}
                        >
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
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <Dropdown
            open={open}
            onOpenChange={handleOpenChange}
            dropdownRender={() => dropdownContent}
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
