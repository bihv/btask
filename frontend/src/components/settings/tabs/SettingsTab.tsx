'use client';

import React from 'react';
import { Typography, Space, Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import {
    UserOutlined,
    BellOutlined,
    GlobalOutlined,
    BgColorsOutlined,
    SafetyOutlined,
} from '@ant-design/icons';
import {
    AccountSettingsSection,
    NotificationsSection,
    LanguageRegionSection,
    ThemeAppearanceSection,
    SessionsSecuritySection,
} from '../sections';

const { Title, Text } = Typography;

export default function SettingsTab() {
    const items: CollapseProps['items'] = [
        {
            key: 'account',
            label: (
                <Space>
                    <UserOutlined />
                    <Text strong>Account Settings</Text>
                </Space>
            ),
            children: <AccountSettingsSection />,
            style: { marginBottom: 16 },
        },
        {
            key: 'notifications',
            label: (
                <Space>
                    <BellOutlined />
                    <Text strong>Notifications</Text>
                </Space>
            ),
            children: <NotificationsSection />,
            style: { marginBottom: 16 },
        },
        {
            key: 'region',
            label: (
                <Space>
                    <GlobalOutlined />
                    <Text strong>Language & Region</Text>
                </Space>
            ),
            children: <LanguageRegionSection />,
            style: { marginBottom: 16 },
        },
        {
            key: 'theme',
            label: (
                <Space>
                    <BgColorsOutlined />
                    <Text strong>Theme & Appearance</Text>
                </Space>
            ),
            children: <ThemeAppearanceSection />,
            style: { marginBottom: 16 },
        },
        {
            key: 'security',
            label: (
                <Space>
                    <SafetyOutlined />
                    <Text strong>Sessions & Security</Text>
                </Space>
            ),
            children: <SessionsSecuritySection />,
            style: { marginBottom: 16 },
        },
    ];

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

            <Collapse
                defaultActiveKey={['account', 'notifications', 'region', 'theme', 'security']}
                style={{ background: 'transparent' }}
                bordered={false}
                items={items}
            />
        </div>
    );
}
