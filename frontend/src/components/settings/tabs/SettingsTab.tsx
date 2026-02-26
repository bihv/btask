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
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

export default function SettingsTab() {
    const t = useTranslation();
    const items: CollapseProps['items'] = [
        {
            key: 'account',
            label: (
                <Space>
                    <UserOutlined />
                    <Text strong>{t('UI_ACCOUNT_SETTINGS')}</Text>
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
                    <Text strong>{t('UI_NOTIFICATIONS')}</Text>
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
                    <Text strong>{t('UI_LANGUAGE_REGION')}</Text>
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
                    <Text strong>{t('UI_THEME_APPEARANCE')}</Text>
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
                    <Text strong>{t('UI_SESSIONS_SECURITY')}</Text>
                </Space>
            ),
            children: <SessionsSecuritySection />,
            style: { marginBottom: 16 },
        },
    ];

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>{t('UI_SETTINGS')}</Title>

            <Collapse
                defaultActiveKey={['account', 'notifications', 'region', 'theme', 'security']}
                style={{ background: 'transparent' }}
                bordered={false}
                items={items}
            />
        </div>
    );
}
