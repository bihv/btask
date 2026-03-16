'use client';

import { useLabels, useTranslation } from '@/hooks/useLabels';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuthStore } from '@/stores/authStore';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { AppShell, Avatar, Button, Group, Loader, NavLink, ScrollArea, Select, Text } from '@mantine/core';
import { IconApi, IconApps, IconBellFilled, IconBlockquote, IconBolt, IconChevronDown, IconCreditCard, IconCrown, IconCurrencyDollar, IconExternalLink, IconHistory, IconLanguage, IconPalette, IconSettings, IconShieldCheck, IconUser, IconUsers, IconWorld, IconX } from '@tabler/icons-react';

interface MenuItem {
    key: string;
    icon?: React.ReactNode;
    label: string;
    children?: MenuItem[];
}

interface SettingsLayoutProps {
    children: React.ReactNode;
    isPersonalSettings?: boolean;
    workspaceId?: string;
}

// Helper function to get workspace initials
const getWorkspaceInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
};

// Generate a color based on workspace name
const getWorkspaceColor = (name: string) => {
    const colors = [
        'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

export default function SettingsLayout({
    children,
    isPersonalSettings,
    workspaceId,
}: SettingsLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoadingAuth } = useAuthStore();
    const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
    const [mounted, setMounted] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(workspaceId || '');

    // Labels loading with React Query (auto-deduplication)
    const { isLoading: labelsLoading, isSuccess: labelsLoaded } = useLabels();
    const t = useTranslation();

    // No need for userId since personal settings always use /me/

    // Extract active tab from pathname (last segment)
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    // Determine active keys
    const activeWorkspaceKey = !isPersonalSettings ? 'ws-' + lastSegment : '';

    useEffect(() => {
        setMounted(true);
        if (!isLoadingAuth && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoadingAuth, router]);

    // Set workspace ID from props or first workspace when loaded
    useEffect(() => {
        if (workspaceId) {
            setSelectedWorkspaceId(workspaceId);
        } else if (workspaces.length > 0 && !selectedWorkspaceId) {
            setSelectedWorkspaceId(workspaces[0].id);
        }
    }, [workspaces, workspaceId, selectedWorkspaceId]);

    const personalMenuItems: MenuItem[] = [
        { key: 'profile', icon: <IconUser size={16} />, label: t('UI_PROFILE_VISIBILITY') },
        { key: 'activity', icon: <IconHistory size={16} />, label: t('UI_ACTIVITY') },
        { key: 'cards', icon: <IconCreditCard size={16} />, label: t('UI_CARDS') },
        { key: 'plugins', icon: <IconApi size={16} />, label: t('UI_MY_PLUGINS') },
        {
            key: 'settings',
            icon: <IconSettings size={16} />,
            label: t('UI_SETTINGS'),
            children: [
                { key: 'settings/account', icon: <IconUser size={16} />, label: t('UI_ACCOUNT') },
                { key: 'settings/notifications', icon: <IconBellFilled size={16} />, label: t('UI_NOTIFICATIONS') },
                { key: 'settings/language', icon: <IconWorld size={16} />, label: t('UI_LANGUAGE_REGION') },
                { key: 'settings/appearance', icon: <IconPalette size={16} />, label: t('UI_APPEARANCE') },
                { key: 'settings/security', icon: <IconShieldCheck size={16} />, label: t('UI_SECURITY') },
            ],
        },
    ];

    const workspaceMenuItems: MenuItem[] = [
        { key: 'ws-boards', icon: <IconApps size={16} />, label: t('UI_BOARDS') },
        { key: 'ws-members', icon: <IconUsers size={16} />, label: t('UI_WORKSPACE_MEMBERS') },
        { key: 'ws-settings', icon: <IconSettings size={16} />, label: t('UI_SETTINGS') },
        { key: 'ws-powerups', icon: <IconBolt size={16} />, label: t('UI_POWERUPS') },
        { key: 'ws-billing', icon: <IconCurrencyDollar size={16} />, label: t('UI_BILLING') },
        { key: 'ws-export', icon: <IconExternalLink size={16} />, label: t('UI_EXPORT') },
    ];

    const adminMenuItems: MenuItem[] = [
        { key: 'admin-users', icon: <IconCrown size={16} />, label: t('UI_USER_MANAGEMENT') },
        { key: 'admin-labels', icon: <IconLanguage size={16} />, label: t('UI_SYSTEM_LABELS') },
        { key: 'admin-templates', icon: <IconBlockquote size={16} />, label: t('UI_TEMPLATES') },
        { key: 'admin-plugins', icon: <IconApi size={16} />, label: t('UI_PLUGINS') },
        {
            key: 'admin-settings',
            icon: <IconSettings size={16} />,
            label: t('UI_SYSTEM_SETTINGS'),
            children: [
                { key: 'admin-settings-general', label: t('UI_GENERAL') },
                { key: 'admin-settings-security', label: t('UI_FILE_SECURITY') },
            ],
        },
    ];

    const handleMenuClick = (key: string, type: 'personal' | 'workspace' | 'admin') => {
        if (type === 'personal') {
            router.push(`/me/${key}`);
        } else if (type === 'workspace' && selectedWorkspaceId && key.startsWith('ws-')) {
            const tab = key.replace('ws-', '');
            router.push(`/workspace/${selectedWorkspaceId}/${tab}`);
        } else if (type === 'admin') {
            if (key === 'admin-users') router.push('/admin/users');
            else if (key === 'admin-labels') router.push('/admin/labels');
            else if (key === 'admin-templates') router.push('/admin/templates');
            else if (key === 'admin-plugins') router.push('/admin/plugins');
            else if (key === 'admin-settings') router.push('/admin/settings/general');
            else if (key === 'admin-settings-general') router.push('/admin/settings/general');
            else if (key === 'admin-settings-security') router.push('/admin/settings/security');
        }
    };

    const handleClose = () => {
        router.push('/workspaces');
    };

    const handleWorkspaceChange = (value: string) => {
        setSelectedWorkspaceId(value);
        // If in workspace mode, navigate to the same tab in the new workspace
        if (!isPersonalSettings) {
            const currentTab = lastSegment || 'boards';
            router.push(`/workspace/${value}/${currentTab}`);
        }
    };

    // Determine active admin key based on path conventions
    const activeAdminKey = (() => {
        if (!pathname.startsWith('/admin')) return '';

        // Handle settings sub-pages (e.g., /admin/settings/general -> admin-settings-general)
        if (pathname.includes('/settings/')) {
            return `admin-settings-${lastSegment}`;
        }
        // Handle root settings (fallback to general)
        if (pathname === '/admin/settings') {
            return 'admin-settings-general';
        }

        // Handle standard admin pages (e.g., /admin/users -> admin-users)
        return `admin-${lastSegment}`;
    })();

    // Determine active personal key
    const activePersonalKey = (() => {
        if (!pathname.startsWith('/me')) return '';

        // Handle settings sub-pages
        if (pathname.includes('/me/settings/')) {
            return `settings/${lastSegment}`;
        }

        // Handle root settings (redirects to account usually, but for highlighting)
        if (pathname === '/me/settings') {
            return 'settings/account';
        }

        // Handle standard personal pages
        return lastSegment;
    })();

    const renderNavLinks = (items: MenuItem[], type: 'personal' | 'workspace' | 'admin', activeKey: string, defaultOpenKeys: string[]) => {
        return items.map((item) => {
            if (item.children) {
                return (
                    <NavLink
                        key={item.key}
                        label={item.label}
                        leftSection={item.icon}
                        defaultOpened={defaultOpenKeys.includes(item.key)}
                    >
                        {item.children.map((child) => (
                            <NavLink
                                key={child.key}
                                label={child.label}
                                leftSection={child.icon}
                                active={activeKey === child.key}
                                onClick={() => handleMenuClick(child.key, type)}
                            />
                        ))}
                    </NavLink>
                );
            }
            return (
                <NavLink
                    key={item.key}
                    label={item.label}
                    leftSection={item.icon}
                    active={activeKey === item.key}
                    onClick={() => handleMenuClick(item.key, type)}
                />
            );
        });
    };

    if (!mounted || isLoadingAuth || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <AppShell
            navbar={{ width: 240, breakpoint: 'sm' }}
            padding="md"
            style={{ backgroundColor: 'var(--mantine-color-body)' }}
        >
            <AppShell.Navbar p="xs">
                <ScrollArea h="100%">
                    {/* Close button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <Button
                            variant="subtle"
                            leftSection={<IconX size={16} />}
                            onClick={handleClose}
                            size="compact-md"
                        >
                            {t('UI_CLOSE')}
                        </Button>
                    </div>

                    {/* Personal Settings */}
                    <div style={{ marginBottom: 16 }}>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5} px="sm" mb={4}>
                            Personal Settings
                        </Text>
                        {renderNavLinks(personalMenuItems, 'personal', activePersonalKey, ['settings'])}
                    </div>

                    {/* Workspace Section with Dropdown */}
                    <div style={{ marginBottom: 16 }}>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5} px="sm" mb={4}>
                            {t('UI_WORKSPACE')}
                        </Text>

                        {/* Workspace Dropdown Selector */}
                        {isLoadingWorkspaces ? (
                            <div style={{ padding: '8px 12px' }}>
                                <Loader size="sm" />
                            </div>
                        ) : (
                            <div style={{ padding: '0 8px', marginBottom: 8 }}>
                                <Select
                                    value={selectedWorkspaceId || null}
                                    onChange={(val) => {
                                        if (val) handleWorkspaceChange(val);
                                    }}
                                    data={workspaces.map(ws => ({
                                        value: ws.id,
                                        label: ws.name,
                                        color: getWorkspaceColor(ws.name),
                                    }))}
                                    rightSection={<IconChevronDown size={14} />}
                                    placeholder={t('UI_SELECT_WORKSPACE')}
                                    renderOption={({ option }) => (
                                        <Group gap="sm">
                                            <Avatar
                                                size={24}
                                                radius="sm"
                                                style={{ background: (option as any).color as string }}
                                                color="white"
                                            >
                                                {getWorkspaceInitials(option.label)}
                                            </Avatar>
                                            <Text size="sm">{option.label}</Text>
                                        </Group>
                                    )}
                                />
                            </div>
                        )}

                        {/* Workspace Nav Links */}
                        {renderNavLinks(workspaceMenuItems, 'workspace', activeWorkspaceKey, [])}
                    </div>

                    {/* Admin Section - only visible to admins */}
                    {user?.is_admin && (
                        <div>
                            <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5} px="sm" mb={4}>
                                Admin
                            </Text>
                            {renderNavLinks(adminMenuItems, 'admin', activeAdminKey, ['admin-settings'])}
                        </div>
                    )}
                </ScrollArea>
            </AppShell.Navbar>

            <AppShell.Main>
                <div style={{ padding: '16px 32px' }}>
                    {children}
                </div>
            </AppShell.Main>
        </AppShell>
    );
}
