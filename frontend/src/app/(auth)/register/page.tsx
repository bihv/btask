'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Typography, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';

const { Title } = Typography;

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const onFinish = async (values: {
        email: string;
        password: string;
        fullName: string;
    }) => {
        try {
            await register(values.email, values.password, values.fullName);
            message.success('Registration successful!');
            router.push('/workspaces');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    Create Account
                </Title>
                <p className={styles.subtitle}>Join us and start organizing!</p>
            </div>

            <Form
                form={form}
                name="register"
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                >
                    <Input

                        placeholder="Enter your full name"
                        autoComplete="name"
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
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
                    label="Password"
                    rules={[
                        { required: true, message: 'Please enter your password' },
                        { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                >
                    <Input.Password

                        placeholder="Enter your password"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['password']}
                    rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match'));
                            },
                        }),
                    ]}
                >
                    <Input.Password

                        placeholder="Confirm your password"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'CREATE ACCOUNT'}
                    </button>
                </Form.Item>

                <div className={styles.footer}>
                    <span>
                        Already have an account?{' '}
                        <Link href="/login">Log in</Link>
                    </span>
                </div>
            </Form>
        </div>
    );
}
