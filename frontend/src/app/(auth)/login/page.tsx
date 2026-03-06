'use client';

import { useInvalidateLabels, useTranslation } from '@/hooks/useLabels';
import { useAuthStore } from '@/stores/authStore';
import { PasswordInput, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const t = useTranslation();
    const invalidateLabels = useInvalidateLabels();
    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => {
                if (!value) return t('VALIDATE_EMAIL_REQUIRED');
                if (!/\S+@\S+\.\S+/.test(value)) return t('VALIDATE_EMAIL_FORMAT');
                return null;
            },
            password: (value) => (!value ? t('VALIDATE_PASSWORD_REQUIRED') : null),
        },
    });

    const onSubmit = async (values: typeof form.values) => {
        try {
            await login(values.email, values.password);
            invalidateLabels();
            router.push('/workspaces');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_LOGIN_FAILED'), color: 'red' });
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title order={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    {t('UI_LOGIN')}
                </Title>
                <p className={styles.subtitle}>{t('UI_WELCOME_ONBOARD')}</p>
            </div>

            <form onSubmit={form.onSubmit(onSubmit)}>
                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_EMAIL')}</span>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_EMAIL')}
                        autoComplete="email"
                        size="lg"
                        {...form.getInputProps('email')}
                        styles={{ input: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' } }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_PASSWORD')}</span>
                    <PasswordInput
                        placeholder={t('UI_PLACEHOLDER_PASSWORD')}
                        autoComplete="current-password"
                        size="lg"
                        {...form.getInputProps('password')}
                        styles={{ input: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' } }}
                    />
                </div>

                <div className={styles.forgotPassword}>
                    <Link href="/forgot-password">{t('UI_FORGOT_PASSWORD')}</Link>
                </div>

                <button
                    type="submit"
                    className={styles.loginButton}
                    disabled={isLoading}
                >
                    {isLoading ? t('UI_LOGGING_IN') : t('UI_LOGIN')}
                </button>

                <div className={styles.footer}>
                    <span>
                        {t('UI_NEW_TO_MELLO')}{' '}
                        <Link href="/register">{t('UI_REGISTER_HERE')}</Link>
                    </span>
                </div>
            </form>
        </div>
    );
}
