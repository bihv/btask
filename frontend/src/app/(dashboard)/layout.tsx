'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Dropdown, Typography, Spin, Divider } from 'antd';
import {
    HomeOutlined,
    ProjectOutlined,
    AppstoreOutlined,
    StarOutlined,
    SettingOutlined,
    LogoutOutlined,
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
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useWebSocket } from '@/hooks/useWebSocket';
import UserAvatar from '@/components/common/UserAvatar';
import GlobalSearch from '@/components/common/GlobalSearch';
import CreateDropdown from '@/components/common/CreateDropdown';
import { useLabels } from '@/hooks/useLabels';
import styles from './DashboardLayout.module.css';

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
    const { preference, resolvedTheme, setTheme } = useTheme();
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
            key: '/boards',
            icon: <ProjectOutlined />,
            label: 'Boards',
        },
        {
            key: '/templates',
            icon: <AppstoreOutlined />,
            label: 'Templates',
        },
    ];

    const handleNavClick = (e: { key: string }) => {
        if (e.key.startsWith('/')) {
            router.push(e.key);
        }
    };

    // Avatar dropdown menu content
    const avatarDropdownContent = (
        <div className={styles.avatarDropdownMenu}>
            {/* User Info */}
            <div className={styles.dropdownSection}>
                <div className={styles.dropdownUserInfo}>
                    <UserAvatar
                        avatarUrl={user?.avatar_url}
                        name={user?.full_name}
                        size={40}
                    />
                    <div className={styles.dropdownUserDetails}>
                        <div className={styles.dropdownUserName}>{user?.full_name || 'User'}</div>
                        <div className={styles.dropdownUserEmail}>{user?.email}</div>
                    </div>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Account Section */}
            <div className={styles.dropdownSection}>
                <div className={styles.dropdownSectionLabel}>Account</div>
                <div className={styles.dropdownMenuItem} onClick={() => router.push('/me/profile')}>
                    <UserOutlined />
                    <span>Profile and visibility</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => router.push('/activity')}>
                    <HistoryOutlined />
                    <span>Activity</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => router.push('/me/cards')}>
                    <CreditCardOutlined />
                    <span>Cards</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => router.push('/me/settings')}>
                    <SettingOutlined />
                    <span>Settings</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className={styles.dropdownSection}>
                <div className={styles.dropdownMenuItem} onClick={() => router.push('/workspaces')}>
                    <TeamOutlined />
                    <span>Create Workspace</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className={styles.dropdownSection}>
                <div className={styles.dropdownMenuItem} onClick={() => { }}>
                    <QuestionCircleOutlined />
                    <span>Help</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => { }}>
                    <ThunderboltOutlined />
                    <span>Shortcuts</span>
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className={styles.dropdownSection}>
                <div
                    className={`${styles.dropdownMenuItem} ${styles.logoutItem}`}
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


            {/* Row 1: Top Header Bar (same as board layout) */}
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

                {/* Right: Create + Theme + Notifications + Avatar */}
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

            {/* Row 2: Sidebar + Content */}
            <Layout style={{ height: 'calc(100vh - 48px)' }}>
                {/* Left: Sidebar */}
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={220}
                    collapsedWidth={60}
                    style={{
                        borderRight: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        overflow: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: collapsed ? 'center' : 'flex-end',
                            padding: '8px',
                        }}
                    >
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
                        style={{ border: 'none' }}
                    />
                </Sider>

                {/* Right: Main Content */}
                <Content style={{ overflow: 'auto', background: 'var(--bg-secondary)' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
