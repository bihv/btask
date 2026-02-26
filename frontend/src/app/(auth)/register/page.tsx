'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Typography, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import styles from '../auth.module.css';
import { useTranslation } from '@/hooks/useLabels';

const { Title } = Typography;

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const t = useTranslation();

    const onFinish = async (values: {
        email: string;
        password: string;
        fullName: string;
    }) => {
        try {
            await register(values.email, values.password, values.fullName);
            router.push('/workspaces');
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_REGISTRATION_FAILED'));
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
                    {t('UI_CREATE_ACCOUNT')}
                </Title>
                <p className={styles.subtitle}>{t('UI_JOIN_US')}</p>
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
                    label={<span className={styles.formLabel}>{t('UI_FULL_NAME')}</span>}
                    rules={[{ required: true, message: t('VALIDATE_FULL_NAME') }]}
                >
                    <Input

                        placeholder={t('UI_PLACEHOLDER_FULL_NAME')}
                        autoComplete="name"
                    />
                </Form.Item>

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
                    rules={[
                        { required: true, message: t('VALIDATE_PASSWORD_REQUIRED') },
                        { min: 6, message: t('VALIDATE_PASSWORD_MIN') },
                    ]}
                >
                    <Input.Password

                        placeholder={t('UI_PLACEHOLDER_PASSWORD')}
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label={<span className={styles.formLabel}>{t('UI_CONFIRM_PASSWORD')}</span>}
                    dependencies={['password']}
                    rules={[
                        { required: true, message: t('VALIDATE_CONFIRM_PASSWORD') },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('VALIDATE_PASSWORD_MISMATCH')));
                            },
                        }),
                    ]}
                >
                    <Input.Password

                        placeholder={t('UI_PLACEHOLDER_CONFIRM_PASSWORD')}
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={isLoading}
                    >
                        {isLoading ? t('UI_CREATING') : t('UI_CREATE_ACCOUNT')}
                    </button>
                </Form.Item>

                <div className={styles.footer}>
                    <span>
                        {t('UI_ALREADY_HAVE_ACCOUNT')}{' '}
                        <Link href="/login">{t('UI_LOG_IN')}</Link>
                    </span>
                </div>
            </Form>
        </div>
    );
}
