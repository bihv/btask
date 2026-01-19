'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Typography, Spin, Result, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const { Title } = Typography;

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { setUser } = useAuthStore();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // Prevent double call in React StrictMode
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Token is missing.');
            return;
        }

        // Prevent double verification in StrictMode
        if (hasVerified.current) {
            return;
        }
        hasVerified.current = true;

        const verifyEmail = async () => {
            try {
                const response = await api.get(`/users/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.data.message || 'Email changed successfully!');
                setNewEmail(response.data.data.email || '');

                // Refresh user data in auth store
                try {
                    const userResponse = await api.get('/users/me');
                    setUser(userResponse.data.data);
                } catch {
                    // Silently fail - user may need to re-login
                }
            } catch (error: unknown) {
                setStatus('error');
                const err = error as { response?: { data?: { message?: string } } };
                setMessage(err.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
            }
        };

        verifyEmail();
    }, [token, setUser]);

    const handleGoToSettings = () => {
        router.push('/me/settings');
    };

    const handleGoToLogin = () => {
        router.push('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
                <Title level={3} style={{ marginBottom: 24 }}>
                    Email Verification
                </Title>

                {status === 'loading' && (
                    <div style={{ padding: '40px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16 }}>Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Email Verified!"
                        subTitle={
                            <>
                                {message}
                                {newEmail && (
                                    <p style={{ marginTop: 8 }}>
                                        Your new email is: <strong>{newEmail}</strong>
                                    </p>
                                )}
                            </>
                        }
                        extra={[
                            <Button type="primary" key="settings" onClick={handleGoToSettings}>
                                Go to Settings
                            </Button>,
                            <Button key="login" onClick={handleGoToLogin}>
                                Login Again
                            </Button>,
                        ]}
                    />
                )}

                {status === 'error' && (
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title="Verification Failed"
                        subTitle={message}
                        extra={[
                            <Button type="primary" key="settings" onClick={handleGoToSettings}>
                                Go to Settings
                            </Button>,
                            <Button key="login" onClick={handleGoToLogin}>
                                Go to Login
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
