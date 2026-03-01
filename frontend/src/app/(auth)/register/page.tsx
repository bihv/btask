'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TextInput, PasswordInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';
import { useTranslation } from '@/hooks/useLabels';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const t = useTranslation();
    const form = useForm({
        initialValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            fullName: (value) => (!value ? t('VALIDATE_FULL_NAME') : null),
            email: (value) => {
                if (!value) return t('VALIDATE_EMAIL_REQUIRED');
                if (!/\S+@\S+\.\S+/.test(value)) return t('VALIDATE_EMAIL_FORMAT');
                return null;
            },
            password: (value) => {
                if (!value) return t('VALIDATE_PASSWORD_REQUIRED');
                if (value.length < 6) return t('VALIDATE_PASSWORD_MIN');
                return null;
            },
            confirmPassword: (value, values) => {
                if (!value) return t('VALIDATE_CONFIRM_PASSWORD');
                if (value !== values.password) return t('VALIDATE_PASSWORD_MISMATCH');
                return null;
            },
        },
    });

    const onSubmit = async (values: typeof form.values) => {
        try {
            await register(values.email, values.password, values.fullName);
            router.push('/workspaces');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_REGISTRATION_FAILED'), color: 'red' });
        }
    };

    const inputStyles = { input: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' } };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title order={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    {t('UI_CREATE_ACCOUNT')}
                </Title>
                <p className={styles.subtitle}>{t('UI_JOIN_US')}</p>
            </div>

            <form onSubmit={form.onSubmit(onSubmit)}>
                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_FULL_NAME')}</span>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_FULL_NAME')}
                        autoComplete="name"
                        size="lg"
                        styles={inputStyles}
                        {...form.getInputProps('fullName')}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_EMAIL')}</span>
                    <TextInput
                        placeholder={t('UI_PLACEHOLDER_EMAIL')}
                        autoComplete="email"
                        size="lg"
                        styles={inputStyles}
                        {...form.getInputProps('email')}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_PASSWORD')}</span>
                    <PasswordInput
                        placeholder={t('UI_PLACEHOLDER_PASSWORD')}
                        autoComplete="new-password"
                        size="lg"
                        styles={inputStyles}
                        {...form.getInputProps('password')}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <span className={styles.formLabel}>{t('UI_CONFIRM_PASSWORD')}</span>
                    <PasswordInput
                        placeholder={t('UI_PLACEHOLDER_CONFIRM_PASSWORD')}
                        autoComplete="new-password"
                        size="lg"
                        styles={inputStyles}
                        {...form.getInputProps('confirmPassword')}
                    />
                </div>

                <button
                    type="submit"
                    className={styles.loginButton}
                    disabled={isLoading}
                >
                    {isLoading ? t('UI_CREATING') : t('UI_CREATE_ACCOUNT')}
                </button>

                <div className={styles.footer}>
                    <span>
                        {t('UI_ALREADY_HAVE_ACCOUNT')}{' '}
                        <Link href="/login">{t('UI_LOG_IN')}</Link>
                    </span>
                </div>
            </form>
        </div>
    );
}
