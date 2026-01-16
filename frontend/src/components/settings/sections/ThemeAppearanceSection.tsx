'use client';

import React from 'react';
import { Typography, Card, Space, Divider, Radio, Tag } from 'antd';
import { useTheme } from '@/providers/ThemeProvider';

const { Title, Text } = Typography;

export default function ThemeAppearanceSection() {
    const { mode, setTheme } = useTheme();

    return (
        <Card size="small">
            <Title level={5} style={{ marginTop: 0 }}>Color Mode</Title>
            <Radio.Group
                value={mode}
                onChange={(e) => setTheme(e.target.value)}
                style={{ width: '100%' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio.Button
                        value="light"
                        style={{
                            width: '100%',
                            height: 'auto',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Space>
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                background: '#ffffff',
                                border: '1px solid #d9d9d9',
                            }} />
                            <div>
                                <Text strong>Light</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>A clean, bright interface</Text>
                            </div>
                        </Space>
                    </Radio.Button>
                    <Radio.Button
                        value="dark"
                        style={{
                            width: '100%',
                            height: 'auto',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Space>
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                background: '#1d2125',
                                border: '1px solid #38414a',
                            }} />
                            <div>
                                <Text strong>Dark</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>Easy on the eyes, great for night</Text>
                            </div>
                        </Space>
                    </Radio.Button>
                </Space>
            </Radio.Group>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ opacity: 0.5 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    Color Scheme
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                </Title>
                <Text type="secondary">Customize your primary color theme</Text>
            </div>
        </Card>
    );
}
