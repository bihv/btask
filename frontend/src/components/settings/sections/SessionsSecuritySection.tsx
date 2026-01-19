'use client';

import React from 'react';
import { Typography, Card, Divider, Button, Tag } from 'antd';

const { Title, Text } = Typography;

export default function SessionsSecuritySection() {
    return (
        <Card size="small">
            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    Active Sessions
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                </Title>
                <Text type="secondary">View and manage your active sessions</Text>
            </div>

            <Divider />

            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    Two-Factor Authentication
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                </Title>
                <Text type="secondary">Add an extra layer of security to your account</Text>
            </div>

            <Divider />

            <div>
                <Title level={5} style={{ marginTop: 0 }}>Logout from all devices</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    This will log you out from all devices except this one
                </Text>
                <Button disabled>
                    Logout Everywhere
                </Button>
                <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
            </div>
        </Card>
    );
}
