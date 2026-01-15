'use client';

import React from 'react';
import { Typography, Form, Input, Button, Card, Alert, Space, Flex } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph, Link } = Typography;
const { TextArea } = Input;

export default function ProfileVisibilityTab() {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Profile and Visibility</Title>

            {/* Banner */}
            <div style={{
                width: '100%',
                height: 120,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
            }}>
                <span style={{ fontSize: 48 }}>🐱</span>
            </div>

            {/* About Section */}
            <Card>
                <Title level={5} style={{ marginTop: 0 }}>About</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Required fields are marked with an asterisk *
                </Text>

                <Form layout="vertical">
                    {/* Username */}
                    <Form.Item
                        label={
                            <Flex justify="space-between" style={{ width: '100%' }}>
                                <span>Username *</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Always public</Text>
                                </Space>
                            </Flex>
                        }
                        required
                    >
                        <Input placeholder="Enter username" />
                    </Form.Item>

                    {/* Bio */}
                    <Form.Item
                        label={
                            <Flex justify="space-between" style={{ width: '100%' }}>
                                <span>Bio</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Always public</Text>
                                </Space>
                            </Flex>
                        }
                    >
                        <TextArea rows={4} placeholder="Tell us about yourself" />
                    </Form.Item>

                    {/* Save Button */}
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Button type="primary">Save</Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
