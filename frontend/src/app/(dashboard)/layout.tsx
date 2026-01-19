'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Dropdown, Typography, Spin, Divider } from 'antd';
import {
    HomeOutlined,
    ProjectOutlined,
    StarOutlined,
    SettingOutlined,
    LogoutOutlined,
    PlusOutlined,
    SunOutlined,
    MoonOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    HistoryOutlined,
    CreditCardOutlined,
    QuestionCircleOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import { useHeader } from '@/providers/HeaderProvider';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { MenuProps } from 'antd';
import UserAvatar from '@/components/common/UserAvatar';
import { useLabels } from '@/hooks/useLabels';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { mode, toggleTheme } = useTheme();
    const { headerContent } = useHeader();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Labels loading with React Query (auto-deduplication)
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

    // Show loading until mounted, authenticated, AND labels are loaded
    if (!mounted || !isAuthenticated || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const menuItems = [
        {
            key: '/workspaces',
            icon: <HomeOutlined />,
            label: 'Home',
        },
        {
            key: '/starred',
            icon: <StarOutlined />,
            label: 'Starred',
        },
    ];

    const handleNavClick = (e: { key: string }) => {
        if (e.key === 'starred') {
            router.push('/starred');
        } else if (e.key.startsWith('/')) {
            router.push(e.key);
        }
    };

    // Avatar dropdown menu content
    const avatarDropdownContent = (
        <div className="avatar-dropdown-menu">
            {/* ACCOUNT Section */}
            <div className="dropdown-section">
                <div className="dropdown-section-label">ACCOUNT</div>
                <div className="dropdown-user-info">
                    <UserAvatar
                        avatarUrl={user?.avatar_url}
                        name={user?.full_name}
                        size={40}
                    />
                    <div className="dropdown-user-details">
                        <div className="dropdown-user-name">{user?.full_name || 'User'}</div>
                        <div className="dropdown-user-email">{user?.email || ''}</div>
                    </div>
                </div>
                <div className="dropdown-menu-item" onClick={() => { }}>
                    <span>Switch accounts</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => { }}>
                    <span>Manage account</span>
                    <ExportOutlined style={{ fontSize: 12 }} />
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* MELLO Section */}
            <div className="dropdown-section">
                <div className="dropdown-section-label">MELLO</div>
                <div className="dropdown-menu-item" onClick={() => router.push('/me/profile')}>
                    <UserOutlined />
                    <span>Profile and visibility</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/me/activity')}>
                    <HistoryOutlined />
                    <span>Activity</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/me/cards')}>
                    <CreditCardOutlined />
                    <span>Cards</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => router.push('/me/settings')}>
                    <SettingOutlined />
                    <span>Settings</span>
                </div>
                <div className="dropdown-menu-item theme-item" onClick={toggleTheme}>
                    {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                    <span>Theme</span>
                    <span className="theme-value">{mode === 'dark' ? 'Dark' : 'Light'}</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Actions Section */}
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
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 14px;
                    color: var(--text-primary);
                    transition: background 0.15s ease;
                }
                .dropdown-menu-item:hover {
                    background: var(--bg-tertiary);
                }
                .dropdown-menu-item.logout-item {
                    color: #cf1322;
                }
                .dropdown-menu-item.theme-item .theme-value {
                    margin-left: auto;
                    font-size: 12px;
                    color: var(--text-secondary);
                }
            `}</style>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                style={{
                    borderRight: `1px solid var(--border-color)`,
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    overflow: 'auto',
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        borderBottom: `1px solid var(--border-color)`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                            src="/mello-icon-only.svg"
                            alt="Mello"
                            style={{ width: 32, height: 32 }}
                        />
                        {!collapsed && (
                            <span style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.5px'
                            }}>
                                Mello
                            </span>
                        )}
                    </div>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        size="small"
                    />
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={handleNavClick}
                    style={{ border: 'none', marginTop: 8 }}
                />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
                <Header
                    style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid var(--border-color)`,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    {/* Dynamic header content from child pages */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {headerContent}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                            onClick={toggleTheme}
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

                <Content style={{ overflow: 'auto', height: 'calc(100vh - 64px)' }}>{children}</Content>
            </Layout>
        </Layout>
    );
}
