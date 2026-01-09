'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Spin } from 'antd';
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
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import type { MenuProps } from 'antd';

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
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!mounted || !isAuthenticated) {
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
            key: 'starred',
            icon: <StarOutlined />,
            label: 'Starred',
        },
    ];

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Log out',
            danger: true,
        },
    ];

    const handleMenuClick = (e: { key: string }) => {
        if (e.key === 'logout') {
            logout();
            router.push('/login');
        } else if (e.key.startsWith('/')) {
            router.push(e.key);
        }
    };

    const handleNavClick = (e: { key: string }) => {
        if (e.key.startsWith('/')) {
            router.push(e.key);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                style={{
                    borderRight: `1px solid var(--border-color)`,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? 0 : '0 16px',
                        borderBottom: `1px solid var(--border-color)`,
                    }}
                >
                    {!collapsed && (
                        <Text strong style={{ fontSize: 20 }}>
                            BTask
                        </Text>
                    )}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={handleNavClick}
                    style={{ border: 'none', marginTop: 8 }}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid var(--border-color)`,
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                            onClick={toggleTheme}
                        />
                        <Button type="primary" icon={<PlusOutlined />}>
                            Create
                        </Button>
                        <Dropdown
                            menu={{ items: userMenuItems, onClick: handleMenuClick }}
                            placement="bottomRight"
                        >
                            <Avatar
                                style={{
                                    backgroundColor: '#0052cc',
                                    cursor: 'pointer',
                                }}
                            >
                                {user?.full_name ? getInitials(user.full_name) : 'U'}
                            </Avatar>
                        </Dropdown>
                    </div>
                </Header>

                <Content style={{ overflow: 'auto' }}>{children}</Content>
            </Layout>
        </Layout>
    );
}
