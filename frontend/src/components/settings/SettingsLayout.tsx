'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Spin, Button, Select } from 'antd';
import {
    UserOutlined,
    HistoryOutlined,
    CreditCardOutlined,
    SettingOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    ExportOutlined,
    CloseOutlined,
    DownOutlined,
    CrownOutlined,
    TranslationOutlined,
    BellOutlined,
    GlobalOutlined,
    BgColorsOutlined,
    SafetyOutlined,
    BlockOutlined,
    ApiOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useLabels } from '@/hooks/useLabels';
import type { MenuProps } from 'antd';

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    const { user, isAuthenticated } = useAuthStore();
    const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
    const [mounted, setMounted] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(workspaceId || '');

    // Labels loading with React Query (auto-deduplication)
    const { isLoading: labelsLoading, isSuccess: labelsLoaded } = useLabels();

    // No need for userId since personal settings always use /me/

    // Extract active tab from pathname (last segment)
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    // Determine active keys
    const activePersonalKey = isPersonalSettings ? lastSegment : '';
    const activeWorkspaceKey = !isPersonalSettings ? 'ws-' + lastSegment : '';

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    // Set workspace ID from props or first workspace when loaded
    useEffect(() => {
        if (workspaceId) {
            setSelectedWorkspaceId(workspaceId);
        } else if (workspaces.length > 0 && !selectedWorkspaceId) {
            setSelectedWorkspaceId(workspaces[0].id);
        }
    }, [workspaces, workspaceId, selectedWorkspaceId]);

    const personalMenuItems: MenuItem[] = [
        { key: 'profile', icon: <UserOutlined />, label: 'Profile and Visibility' },
        { key: 'activity', icon: <HistoryOutlined />, label: 'Activity' },
        { key: 'cards', icon: <CreditCardOutlined />, label: 'Cards' },
        { key: 'plugins', icon: <ApiOutlined />, label: 'My Plugins' },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            children: [
                { key: 'settings/account', icon: <UserOutlined />, label: 'Account' },
                { key: 'settings/notifications', icon: <BellOutlined />, label: 'Notifications' },
                { key: 'settings/language', icon: <GlobalOutlined />, label: 'Language & Region' },
                { key: 'settings/appearance', icon: <BgColorsOutlined />, label: 'Appearance' },
                { key: 'settings/security', icon: <SafetyOutlined />, label: 'Security' },
            ],
        },
    ];

    const workspaceMenuItems: MenuItem[] = [
        { key: 'ws-boards', icon: <AppstoreOutlined />, label: 'Boards' },
        { key: 'ws-members', icon: <TeamOutlined />, label: 'Members' },
        { key: 'ws-settings', icon: <SettingOutlined />, label: 'Settings' },
        { key: 'ws-powerups', icon: <ThunderboltOutlined />, label: 'Power-Ups' },
        { key: 'ws-billing', icon: <DollarOutlined />, label: 'Billing' },
        { key: 'ws-export', icon: <ExportOutlined />, label: 'Export' },
    ];

    const adminMenuItems: MenuItem[] = [
        { key: 'admin-users', icon: <CrownOutlined />, label: 'User Management' },
        { key: 'admin-labels', icon: <TranslationOutlined />, label: 'System Labels' },
        { key: 'admin-templates', icon: <BlockOutlined />, label: 'Templates' },
        { key: 'admin-plugins', icon: <ApiOutlined />, label: 'Plugins' },
    ];

    const handlePersonalMenuClick: MenuProps['onClick'] = (e) => {
        router.push(`/me/${e.key}`);
    };

    const handleWorkspaceMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key.startsWith('ws-') && selectedWorkspaceId) {
            const tab = e.key.replace('ws-', '');
            router.push(`/workspace/${selectedWorkspaceId}/${tab}`);
        }
    };

    const handleAdminMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key === 'admin-users') {
            router.push('/admin/users');
        } else if (e.key === 'admin-labels') {
            router.push('/admin/labels');
        } else if (e.key === 'admin-templates') {
            router.push('/admin/templates');
        } else if (e.key === 'admin-plugins') {
            router.push('/admin/plugins');
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

    // Show loading until mounted, authenticated, AND labels are loaded
    if (!mounted || !isAuthenticated || labelsLoading || !labelsLoaded) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
            {/* Close button */}
            <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 100,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                }}
            />

            <Sider
                width={240}
                style={{
                    borderRight: '1px solid var(--border-color)',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    overflow: 'auto',
                }}
            >
                {/* Personal Settings */}
                <div style={{ padding: '16px 8px 0' }}>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        padding: '8px 12px',
                        marginBottom: 4,
                    }}>
                        Personal Settings
                    </div>
                    <Menu
                        mode="inline"
                        selectedKeys={activePersonalKey ? [activePersonalKey] : []}
                        items={personalMenuItems}
                        onClick={handlePersonalMenuClick}
                        style={{ border: 'none' }}
                    />
                </div>

                {/* Workspace Section with Dropdown */}
                <div style={{ padding: '16px 8px 0' }}>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        padding: '8px 12px',
                        marginBottom: 8,
                    }}>
                        Workspace
                    </div>

                    {/* Workspace Dropdown Selector */}
                    {isLoadingWorkspaces ? (
                        <div style={{ padding: '8px 12px' }}>
                            <Spin size="small" />
                        </div>
                    ) : (
                        <div style={{ padding: '0 8px', marginBottom: 8 }}>
                            <Select
                                value={selectedWorkspaceId || undefined}
                                onChange={handleWorkspaceChange}
                                style={{ width: '100%' }}
                                suffixIcon={<DownOutlined />}
                                optionLabelProp="label"
                                placeholder="Select workspace"
                            >
                                {workspaces.map((ws) => (
                                    <Select.Option key={ws.id} value={ws.id} label={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 4,
                                                background: getWorkspaceColor(ws.name),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}>{getWorkspaceInitials(ws.name)}</div>
                                            <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{ws.name}</span>
                                        </div>
                                    }>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 4,
                                                background: getWorkspaceColor(ws.name),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}>{getWorkspaceInitials(ws.name)}</div>
                                            <span>{ws.name}</span>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    )}

                    {/* Workspace Menu Items */}
                    <Menu
                        mode="inline"
                        selectedKeys={activeWorkspaceKey ? [activeWorkspaceKey] : []}
                        items={workspaceMenuItems}
                        onClick={handleWorkspaceMenuClick}
                        style={{ border: 'none' }}
                    />
                </div>

                {/* Admin Section - only visible to admins */}
                {user?.is_admin && (
                    <div style={{ padding: '16px 8px 0' }}>
                        <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            padding: '8px 12px',
                            marginBottom: 4,
                        }}>
                            Admin
                        </div>
                        <Menu
                            mode="inline"
                            selectedKeys={[]}
                            items={adminMenuItems}
                            onClick={handleAdminMenuClick}
                            style={{ border: 'none' }}
                        />
                    </div>
                )}
            </Sider>

            <Layout style={{ marginLeft: 240 }}>
                <Content style={{
                    padding: '32px 48px',
                    overflow: 'auto',
                    height: '100vh',
                    background: 'var(--bg-primary)',
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
