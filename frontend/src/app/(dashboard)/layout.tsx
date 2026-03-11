'use client';

import CreateDropdown from '@/components/common/CreateDropdown';
import GlobalSearch from '@/components/common/GlobalSearch';
import UserAvatar from '@/components/common/UserAvatar';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useLabels } from '@/hooks/useLabels';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useHeader } from '@/providers/HeaderProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { useAuthLoading } from '@/providers/AuthProvider';
import { ActionIcon, Divider, Loader, NavLink, Popover } from '@mantine/core';
import {
    IconApps,
    IconBolt,
    IconCreditCard,
    IconHelp,
    IconHistory,
    IconHome,
    IconLayoutBoard,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarLeftExpand,
    IconLogout,
    IconMoon,
    IconSettings,
    IconSun,
    IconUser,
    IconUsers
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const isAuthLoading = useAuthLoading();
    const { preference, resolvedTheme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const { headerContent } = useHeader();

    const { isLoading: labelsLoading, isSuccess: labelsLoaded } = useLabels();

    useWebSocket();

    useEffect(() => {
        setMounted(true);
        // Only redirect if auth has been checked and user is not authenticated
        if (!isAuthLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router, isAuthLoading]);

    if (!mounted || isAuthLoading || !isAuthenticated || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Loader size="lg" />
            </div>
        );
    }

    const menuItems = [
        { key: '/workspaces', icon: <IconHome size={18} />, label: 'Home' },
        { key: '/boards', icon: <IconLayoutBoard size={18} />, label: 'Boards' },
        { key: '/templates', icon: <IconApps size={18} />, label: 'Templates' },
    ];

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

            <Divider my={8} />

            {/* Account Section */}
            <div className={styles.dropdownSection}>
                <div className={styles.dropdownSectionLabel}>Account</div>
                <div className={styles.dropdownMenuItem} onClick={() => { setAvatarMenuOpen(false); router.push('/me/profile'); }}>
                    <IconUser size={16} />
                    <span>Profile and visibility</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => { setAvatarMenuOpen(false); router.push('/activity'); }}>
                    <IconHistory size={16} />
                    <span>Activity</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => { setAvatarMenuOpen(false); router.push('/me/cards'); }}>
                    <IconCreditCard size={16} />
                    <span>Cards</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => { setAvatarMenuOpen(false); router.push('/me/settings'); }}>
                    <IconSettings size={16} />
                    <span>Settings</span>
                </div>
            </div>

            <Divider my={8} />

            <div className={styles.dropdownSection}>
                <div className={styles.dropdownMenuItem} onClick={() => { setAvatarMenuOpen(false); router.push('/workspaces'); }}>
                    <IconUsers size={16} />
                    <span>Create Workspace</span>
                </div>
            </div>

            <Divider my={8} />

            <div className={styles.dropdownSection}>
                <div className={styles.dropdownMenuItem} onClick={() => { }}>
                    <IconHelp size={16} />
                    <span>Help</span>
                </div>
                <div className={styles.dropdownMenuItem} onClick={() => { }}>
                    <IconBolt size={16} />
                    <span>Shortcuts</span>
                </div>
            </div>

            <Divider my={8} />

            <div className={styles.dropdownSection}>
                <div
                    className={`${styles.dropdownMenuItem} ${styles.logoutItem}`}
                    onClick={() => {
                        setAvatarMenuOpen(false);
                        logout();
                        router.push('/login');
                    }}
                >
                    <IconLogout size={16} />
                    <span>Log out</span>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Row 1: Top Header Bar */}
            <header
                style={{
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0,
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
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => {
                            const nextTheme = preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
                            setTheme(nextTheme);
                        }}
                    >
                        {resolvedTheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                    </ActionIcon>
                    <NotificationDropdown />
                    <Popover
                        opened={avatarMenuOpen}
                        onChange={setAvatarMenuOpen}
                        position="bottom-end"
                        shadow="md"
                    >
                        <Popover.Target>
                            <div style={{ cursor: 'pointer' }} onClick={() => setAvatarMenuOpen((o) => !o)}>
                                <UserAvatar
                                    avatarUrl={user?.avatar_url}
                                    name={user?.full_name}
                                    size={32}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                            {avatarDropdownContent}
                        </Popover.Dropdown>
                    </Popover>
                </div>
            </header>

            {/* Row 2: Sidebar + Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Sidebar */}
                <nav
                    style={{
                        width: collapsed ? 60 : 220,
                        borderRight: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        transition: 'width 0.2s',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: collapsed ? 'center' : 'flex-end',
                            padding: '8px',
                        }}
                    >
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? <IconLayoutSidebarLeftExpand size={16} /> : <IconLayoutSidebarLeftCollapse size={16} />}
                        </ActionIcon>
                    </div>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.key}
                            label={collapsed ? undefined : item.label}
                            leftSection={item.icon}
                            active={pathname === item.key}
                            onClick={() => router.push(item.key)}
                            style={{ borderRadius: 6, margin: '2px 4px' }}
                        />
                    ))}
                </nav>

                {/* Right: Main Content */}
                <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
                    {headerContent && (
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 64,
                        }}>
                            {headerContent}
                        </div>
                    )}
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
