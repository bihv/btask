'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Typography, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';

const { Title } = Typography;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            await login(values.email, values.password);
            router.push('/workspaces');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    Login
                </Title>
                <p className={styles.subtitle}>Welcome onboard with us!</p>
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
                    label={<span className={styles.formLabel}>Email</span>}
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                    ]}
                >
                    <Input

                        placeholder="Enter your email"
                        autoComplete="email"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={<span className={styles.formLabel}>Password</span>}
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password

                        placeholder="Enter your password"
                        autoComplete="current-password"
                    />
                </Form.Item>

                <div className={styles.forgotPassword}>
                    <Link href="/forgot-password">Forgot Password?</Link>
                </div>

                <Form.Item style={{ marginBottom: 0 }}>
                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'LOGIN'}
                    </button>
                </Form.Item>

                <div className={styles.footer}>
                    <span>
                        New to Mello?{' '}
                        <Link href="/register">Register Here</Link>
                    </span>
                </div>
            </Form>
        </div>
    );
}
