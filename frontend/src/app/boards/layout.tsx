'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Button, Dropdown, Typography, Spin, Divider } from 'antd';
import {
    LogoutOutlined,
    SunOutlined,
    MoonOutlined,
    UserOutlined,
    HistoryOutlined,
    CreditCardOutlined,
    QuestionCircleOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    ExportOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useWebSocket } from '@/hooks/useWebSocket';
import UserAvatar from '@/components/common/UserAvatar';
import GlobalSearch from '@/components/common/GlobalSearch';
import CreateDropdown from '@/components/common/CreateDropdown';
import { useLabels } from '@/hooks/useLabels';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function BoardsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { preference, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Labels loading with React Query
    const { isLoading: labelsLoading, isSuccess: labelsLoaded } = useLabels();

    // Get auth token for WebSocket
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    useWebSocket(token);

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!mounted || !isAuthenticated || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const avatarDropdownContent = (
        <div className="avatar-dropdown-menu">
            {/* User Info */}
            <div className="dropdown-section">
                <div className="dropdown-user-info">
                    <UserAvatar
                        avatarUrl={user?.avatar_url}
                        name={user?.full_name}
                        size={40}
                    />
                    <div className="dropdown-user-details">
                        <div className="dropdown-user-name">{user?.full_name || 'User'}</div>
                        <div className="dropdown-user-email">{user?.email}</div>
                    </div>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Account Section */}
            <div className="dropdown-section">
                <div className="dropdown-section-label">Account</div>
                <div className="dropdown-menu-item" onClick={() => router.push('/settings')}>
                    <UserOutlined />
                    <span>Profile and visibility</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/activity')}>
                    <HistoryOutlined />
                    <span>Activity</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/settings')}>
                    <CreditCardOutlined />
                    <span>Cards</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/settings')}>
                    <SettingOutlined />
                    <span>Settings</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className="dropdown-section">
                <div className="dropdown-menu-item" onClick={() => router.push('/workspaces')}>
                    <TeamOutlined />
                    <span>Create Workspace</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className="dropdown-section">
                <div className="dropdown-menu-item" onClick={() => { }}>
                    <QuestionCircleOutlined />
                    <span>Help</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => { }}>
                    <ThunderboltOutlined />
                    <span>Shortcuts</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className="dropdown-section">
                <div
                    className="dropdown-menu-item logout-item"
                    onClick={() => {
                        logout();
                        router.push('/login');
                    }}
                >
                    <LogoutOutlined />
                    <span>Log out</span>
                </div>
            </div>
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
            <style jsx global>{`
                .avatar-dropdown-menu {
                    width: 304px;
                    padding: 12px 0;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }
                .dropdown-section {
                    padding: 0 12px;
                }
                .dropdown-section-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    padding: 8px 12px 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .dropdown-user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    margin-bottom: 4px;
                }
                .dropdown-user-details {
                    flex: 1;
                    min-width: 0;
                }
                .dropdown-user-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dropdown-user-email {
                    font-size: 12px;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dropdown-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                    color: var(--text-primary);
                }
                .dropdown-menu-item:hover {
                    background: var(--bg-tertiary);
                }
                .dropdown-menu-item.logout-item:hover {
                    background: rgba(255, 77, 79, 0.1);
                    color: #ff4d4f;
                }
            `}</style>

            {/* Top Bar - Row 1 */}
            <Header
                style={{
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    lineHeight: '32px',
                }}
            >
                {/* Left: Logo + App Name */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => router.push('/workspaces')}
                >
                    <img
                        src="/mello-icon-only.svg"
                        alt="Mello"
                        style={{ width: 28, height: 28 }}
                    />
                    <span style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.5px'
                    }}>
                        Mello
                    </span>
                </div>

                {/* Center: Global Search */}
                <GlobalSearch />

                {/* Right: Create + Notifications + Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CreateDropdown />
                    <Button
                        type="text"
                        icon={resolvedTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                        onClick={() => {
                            const nextTheme = preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
                            setTheme(nextTheme);
                        }}
                    />
                    <NotificationDropdown />
                    <Dropdown
                        popupRender={() => avatarDropdownContent}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <div style={{ cursor: 'pointer' }}>
                            <UserAvatar
                                avatarUrl={user?.avatar_url}
                                name={user?.full_name}
                                size={32}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    </Dropdown>
                </div>
            </Header>

            {/* Content - Full width, no sidebar */}
            <Content style={{ overflow: 'hidden', height: 'calc(100vh - 48px)' }}>
                {children}
            </Content>
        </Layout>
    );
}
