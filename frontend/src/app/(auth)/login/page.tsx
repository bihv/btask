'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';

const { Title, Text } = Typography;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [form] = Form.useForm();

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            await login(values.email, values.password);
            message.success('Login successful!');
            router.push('/workspaces');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title level={2} style={{ marginBottom: 8 }}>BTask</Title>
                <Text type="secondary">Task Management Made Simple</Text>
            </div>

            <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                    ]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Email"
                        autoComplete="email"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Password"
                        autoComplete="current-password"
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        style={{ height: 44 }}
                    >
                        Log in
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">
                        Don't have an account?{' '}
                        <Link href="/register" style={{ fontWeight: 500 }}>
                            Sign up
                        </Link>
                    </Text>
                </div>
            </Form>
        </div>
    );
}
