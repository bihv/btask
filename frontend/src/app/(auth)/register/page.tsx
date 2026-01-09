'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
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
        <div className="auth-card">
            <div className="auth-logo">
                <Title level={2} style={{ marginBottom: 8 }}>BTask</Title>
                <Text type="secondary">Create your account</Text>
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
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Full Name"
                        autoComplete="name"
                    />
                </Form.Item>

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
                    rules={[
                        { required: true, message: 'Please enter your password' },
                        { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Password"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
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
                        prefix={<LockOutlined />}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
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
                        Create Account
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">
                        Already have an account?{' '}
                        <Link href="/login" style={{ fontWeight: 500 }}>
                            Log in
                        </Link>
                    </Text>
                </div>
            </Form>
        </div>
    );
}
