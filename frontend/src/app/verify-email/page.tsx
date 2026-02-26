'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Typography, Spin, Result, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useLabels';

const { Title } = Typography;

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { setUser } = useAuthStore();
    const t = useTranslation();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // Prevent double call in React StrictMode
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage(t('ERROR_INVALID_VERIFICATION_LINK'));
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
                setMessage(err.response?.data?.message || t('ERROR_VERIFY_EMAIL_FAILED'));
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
                    {t('UI_EMAIL_VERIFICATION')}
                </Title>

                {status === 'loading' && (
                    <div style={{ padding: '40px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16 }}>{t('UI_VERIFYING_EMAIL')}</p>
                    </div>
                )}

                {status === 'success' && (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title={t('UI_EMAIL_VERIFIED')}
                        subTitle={
                            <>
                                {message}
                                {newEmail && (
                                    <p style={{ marginTop: 8 }}>
                                        {t('UI_YOUR_NEW_EMAIL')} <strong>{newEmail}</strong>
                                    </p>
                                )}
                            </>
                        }
                        extra={[
                            <Button type="primary" key="settings" onClick={handleGoToSettings}>
                                {t('UI_GO_TO_SETTINGS')}
                            </Button>,
                            <Button key="login" onClick={handleGoToLogin}>
                                {t('UI_LOGIN_AGAIN')}
                            </Button>,
                        ]}
                    />
                )}

                {status === 'error' && (
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title={t('UI_VERIFICATION_FAILED')}
                        subTitle={message}
                        extra={[
                            <Button type="primary" key="settings" onClick={handleGoToSettings}>
                                {t('UI_GO_TO_SETTINGS')}
                            </Button>,
                            <Button key="login" onClick={handleGoToLogin}>
                                {t('UI_GO_TO_LOGIN')}
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
