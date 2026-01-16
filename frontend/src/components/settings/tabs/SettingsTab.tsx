'use client';

import React, { useState } from 'react';
import { Typography, Space, Collapse } from 'antd';
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
const { Panel } = Collapse;

export default function SettingsTab() {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

            <Collapse
                defaultActiveKey={['account', 'notifications', 'region', 'theme', 'security']}
                style={{ background: 'transparent' }}
                bordered={false}
            >
                {/* Account Settings */}
                <Panel
                    header={
                        <Space>
                            <UserOutlined />
                            <Text strong>Account Settings</Text>
                        </Space>
                    }
                    key="account"
                    style={{ marginBottom: 16 }}
                >
                    <AccountSettingsSection
                        deleteModalOpen={deleteModalOpen}
                        setDeleteModalOpen={setDeleteModalOpen}
                    />
                </Panel>

                {/* Notifications */}
                <Panel
                    header={
                        <Space>
                            <BellOutlined />
                            <Text strong>Notifications</Text>
                        </Space>
                    }
                    key="notifications"
                    style={{ marginBottom: 16 }}
                >
                    <NotificationsSection />
                </Panel>

                {/* Language & Region */}
                <Panel
                    header={
                        <Space>
                            <GlobalOutlined />
                            <Text strong>Language & Region</Text>
                        </Space>
                    }
                    key="region"
                    style={{ marginBottom: 16 }}
                >
                    <LanguageRegionSection />
                </Panel>

                {/* Theme & Appearance */}
                <Panel
                    header={
                        <Space>
                            <BgColorsOutlined />
                            <Text strong>Theme & Appearance</Text>
                        </Space>
                    }
                    key="theme"
                    style={{ marginBottom: 16 }}
                >
                    <ThemeAppearanceSection />
                </Panel>

                {/* Sessions & Security */}
                <Panel
                    header={
                        <Space>
                            <SafetyOutlined />
                            <Text strong>Sessions & Security</Text>
                        </Space>
                    }
                    key="security"
                    style={{ marginBottom: 16 }}
                >
                    <SessionsSecuritySection />
                </Panel>
            </Collapse>
        </div>
    );
}
