'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Typography, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';
import { useTranslation, useInvalidateLabels } from '@/hooks/useLabels';

const { Title } = Typography;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const t = useTranslation();
    const invalidateLabels = useInvalidateLabels();

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            await login(values.email, values.password);
            invalidateLabels();
            router.push('/workspaces');
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_LOGIN_FAILED'));
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    {t('UI_LOGIN')}
                </Title>
                <p className={styles.subtitle}>{t('UI_WELCOME_ONBOARD')}</p>
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
                    label={<span className={styles.formLabel}>{t('UI_EMAIL')}</span>}
                    rules={[
                        { required: true, message: t('VALIDATE_EMAIL_REQUIRED') },
                        { type: 'email', message: t('VALIDATE_EMAIL_FORMAT') },
                    ]}
                >
                    <Input

                        placeholder={t('UI_PLACEHOLDER_EMAIL')}
                        autoComplete="email"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={<span className={styles.formLabel}>{t('UI_PASSWORD')}</span>}
                    rules={[{ required: true, message: t('VALIDATE_PASSWORD_REQUIRED') }]}
                >
                    <Input.Password

                        placeholder={t('UI_PLACEHOLDER_PASSWORD')}
                        autoComplete="current-password"
                    />
                </Form.Item>

                <div className={styles.forgotPassword}>
                    <Link href="/forgot-password">{t('UI_FORGOT_PASSWORD')}</Link>
                </div>

                <Form.Item style={{ marginBottom: 0 }}>
                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={isLoading}
                    >
                        {isLoading ? t('UI_LOGGING_IN') : t('UI_LOGIN')}
                    </button>
                </Form.Item>

                <div className={styles.footer}>
                    <span>
                        {t('UI_NEW_TO_MELLO')}{' '}
                        <Link href="/register">{t('UI_REGISTER_HERE')}</Link>
                    </span>
                </div>
            </Form>
        </div>
    );
}
