'use client';

import React from 'react';
import { Typography, Card, Form, Input, Button, Space, Modal, App } from 'antd';
import {
    LockOutlined,
    MailOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword, useChangeEmail, useDeleteAccount } from '@/hooks/useUser';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

interface AccountSettingsSectionProps {
    deleteModalOpen: boolean;
    setDeleteModalOpen: (open: boolean) => void;
}

export default function AccountSettingsSection({
    deleteModalOpen,
    setDeleteModalOpen,
}: AccountSettingsSectionProps) {
    const { user } = useAuthStore();
    const t = useTranslation();
    const { message } = App.useApp();

    const changePassword = useChangePassword();
    const changeEmail = useChangeEmail();
    const deleteAccount = useDeleteAccount();

    const [emailForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [deleteForm] = Form.useForm();

    const handlePasswordChange = async (values: { current_password: string; new_password: string; confirm_password: string }) => {
        if (values.new_password !== values.confirm_password) {
            message.error(t('ERROR_PASSWORD_MISMATCH'));
            return;
        }

        try {
            const response = await changePassword.mutateAsync({
                current_password: values.current_password,
                new_password: values.new_password,
            });
            message.success(response.message);
            passwordForm.resetFields();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || t('ERROR_PASSWORD_CHANGE_FAILED'));
        }
    };

    const handleEmailChange = async (values: { new_email: string; password: string }) => {
        // Frontend validation: new email must differ from current email
        if (user?.email && values.new_email.toLowerCase() === user.email.toLowerCase()) {
            message.error(t('ERROR_EMAIL_SAME_AS_CURRENT'));
            return;
        }

        try {
            const response = await changeEmail.mutateAsync(values);
            message.success(response.message || t('SUCCESS_EMAIL_VERIFICATION_SENT'));
            emailForm.resetFields();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || t('ERROR_EMAIL_CHANGE_FAILED'));
        }
    };

    const handleDeleteAccount = async (values: { password: string }) => {
        try {
            const response = await deleteAccount.mutateAsync(values);
            message.success(response.message);
            setDeleteModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || t('ERROR_DELETE_ACCOUNT_FAILED'));
        }
    };

    return (
        <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    <MailOutlined style={{ marginRight: 8 }} />
                    {t('UI_CHANGE_EMAIL')}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_CURRENT_EMAIL')} <strong>{user?.email}</strong>
                </Text>
                <Form form={emailForm} layout="vertical" onFinish={handleEmailChange}>
                    <Form.Item
                        name="new_email"
                        label={t('UI_NEW_EMAIL')}
                        rules={[
                            { required: true, message: t('UI_REQUIRED_NEW_EMAIL') },
                            { type: 'email', message: t('UI_REQUIRED_VALID_EMAIL') },
                        ]}
                    >
                        <Input placeholder={t('UI_PLACEHOLDER_NEW_EMAIL')} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={t('UI_CURRENT_PASSWORD')}
                        rules={[{ required: true, message: t('UI_REQUIRED_PASSWORD') }]}
                    >
                        <Input.Password placeholder={t('UI_PLACEHOLDER_CURRENT_PASSWORD')} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={changeEmail.isPending}>
                        {t('UI_CHANGE_EMAIL')}
                    </Button>
                </Form>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    <LockOutlined style={{ marginRight: 8 }} />
                    {t('UI_CHANGE_PASSWORD')}
                </Title>
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                    <Form.Item
                        name="current_password"
                        label={t('UI_CURRENT_PASSWORD')}
                        rules={[{ required: true, message: t('UI_REQUIRED_CURRENT_PASSWORD') }]}
                    >
                        <Input.Password placeholder={t('UI_PLACEHOLDER_CURRENT_PASSWORD')} />
                    </Form.Item>
                    <Form.Item
                        name="new_password"
                        label={t('UI_NEW_PASSWORD')}
                        rules={[
                            { required: true, message: t('UI_REQUIRED_NEW_PASSWORD') },
                            { min: 6, message: t('UI_PASSWORD_MIN_LENGTH') },
                        ]}
                    >
                        <Input.Password placeholder={t('UI_PLACEHOLDER_NEW_PASSWORD')} />
                    </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        label={t('UI_CONFIRM_NEW_PASSWORD')}
                        rules={[{ required: true, message: t('UI_REQUIRED_CONFIRM_PASSWORD') }]}
                    >
                        <Input.Password placeholder={t('UI_PLACEHOLDER_CONFIRM_PASSWORD')} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
                        {t('UI_CHANGE_PASSWORD')}
                    </Button>
                </Form>
            </Card>

            <Card size="small" style={{ border: '1px solid #ff4d4f' }}>
                <Title level={5} style={{ marginTop: 0, color: '#ff4d4f' }}>
                    <DeleteOutlined style={{ marginRight: 8 }} />
                    {t('UI_DELETE_ACCOUNT')}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_DELETE_WARNING')}
                </Text>
                <Button danger onClick={() => setDeleteModalOpen(true)}>
                    {t('UI_DELETE_ACCOUNT')}
                </Button>
            </Card>

            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                        {t('UI_DELETE_ACCOUNT')}
                    </Space>
                }
                open={deleteModalOpen}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    deleteForm.resetFields();
                }}
                footer={null}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_DELETE_CONFIRM_WARNING')}
                </Text>
                <Form form={deleteForm} layout="vertical" onFinish={handleDeleteAccount}>
                    <Form.Item
                        name="password"
                        label={t('UI_ENTER_PASSWORD_CONFIRM')}
                        rules={[{ required: true, message: t('UI_REQUIRED_PASSWORD') }]}
                    >
                        <Input.Password placeholder={t('UI_PLACEHOLDER_PASSWORD')} />
                    </Form.Item>
                    <Space>
                        <Button onClick={() => setDeleteModalOpen(false)}>{t('UI_CANCEL')}</Button>
                        <Button danger type="primary" htmlType="submit" loading={deleteAccount.isPending}>
                            {t('UI_DELETE_MY_ACCOUNT')}
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </>
    );
}
