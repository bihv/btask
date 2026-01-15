'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function SettingsTab() {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

            <Empty
                image={<SettingOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />}
                description={
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>Settings</Title>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            Configure your account settings, notifications, and preferences.
                            Content will be provided later.
                        </span>
                    </div>
                }
            />
        </div>
    );
}
