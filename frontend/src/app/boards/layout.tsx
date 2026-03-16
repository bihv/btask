'use client';

import CreateDropdown from '@/components/common/CreateDropdown';
import GlobalSearch from '@/components/common/GlobalSearch';
import UserAvatar from '@/components/common/UserAvatar';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useLabels } from '@/hooks/useLabels';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, Loader, Menu } from '@mantine/core';
import { IconBolt, IconCreditCard, IconHelp, IconHistory, IconLogout, IconMoon, IconSettings, IconSun, IconUser, IconUsers } from '@tabler/icons-react';

export default function BoardsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAuthenticated, isLoadingAuth, logout } = useAuthStore();
    const { preference, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Labels loading with React Query
    const { isLoading: labelsLoading, isSuccess: labelsLoaded } = useLabels();

    // WebSocket connection (token handled internally)
    useWebSocket();

    useEffect(() => {
        setMounted(true);
        if (!isLoadingAuth && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoadingAuth, router]);

    if (!mounted || isLoadingAuth || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Loader size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

            {/* Top Bar */}
            <header
                style={{
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    lineHeight: '32px',
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

                {/* Right: Create + Notifications + Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CreateDropdown />
                    <Button
                        variant="subtle"
                        leftSection={resolvedTheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                        onClick={() => {
                            const nextTheme = preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
                            setTheme(nextTheme);
                        }}
                    />
                    <NotificationDropdown />
                    <Menu position="bottom-end" shadow="md" width={304}>
                        <Menu.Target>
                            <div style={{ cursor: 'pointer' }}>
                                <UserAvatar
                                    avatarUrl={user?.avatar_url}
                                    name={user?.full_name}
                                    size={32}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        </Menu.Target>
                        <Menu.Dropdown>
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

                            <Menu.Divider />

                            <Menu.Label>Account</Menu.Label>
                            <Menu.Item leftSection={<IconUser size={16} />} onClick={() => router.push('/me/profile')}>
                                Profile and visibility
                            </Menu.Item>
                            <Menu.Item leftSection={<IconHistory size={16} />} onClick={() => router.push('/me/activity')}>
                                Activity
                            </Menu.Item>
                            <Menu.Item leftSection={<IconCreditCard size={16} />} onClick={() => router.push('/me/cards')}>
                                Cards
                            </Menu.Item>
                            <Menu.Item leftSection={<IconSettings size={16} />} onClick={() => router.push('/me/settings')}>
                                Settings
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item leftSection={<IconUsers size={16} />} onClick={() => router.push('/workspaces')}>
                                Create Workspace
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item leftSection={<IconHelp size={16} />} onClick={() => { }}>
                                Help
                            </Menu.Item>
                            <Menu.Item leftSection={<IconBolt size={16} />} onClick={() => { }}>
                                Shortcuts
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item
                                color="red"
                                leftSection={<IconLogout size={16} />}
                                onClick={() => {
                                    logout();
                                    router.push('/login');
                                }}
                            >
                                Log out
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>
            </header>

            {/* Content */}
            <main style={{ overflow: 'hidden', flex: 1 }}>
                {children}
            </main>
        </div>
    );
}
