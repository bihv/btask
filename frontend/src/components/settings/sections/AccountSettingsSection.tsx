'use client';

import React from 'react';
import { Typography, Card, Form, Input, Button, Space, message, Modal } from 'antd';
import {
    LockOutlined,
    MailOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword, useChangeEmail, useDeleteAccount } from '@/hooks/useUser';

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

    const changePassword = useChangePassword();
    const changeEmail = useChangeEmail();
    const deleteAccount = useDeleteAccount();

    const [passwordForm] = Form.useForm();
    const [emailForm] = Form.useForm();
    const [deleteForm] = Form.useForm();

    const handlePasswordChange = async (values: { current_password: string; new_password: string; confirm_password: string }) => {
        if (values.new_password !== values.confirm_password) {
            message.error('New passwords do not match');
            return;
        }

        try {
            await changePassword.mutateAsync({
                current_password: values.current_password,
                new_password: values.new_password,
            });
            message.success('Password changed successfully');
            passwordForm.resetFields();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'Failed to change password');
        }
    };

    const handleEmailChange = async (values: { new_email: string; password: string }) => {
        try {
            await changeEmail.mutateAsync(values);
            message.success('Email changed successfully');
            emailForm.resetFields();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'Failed to change email');
        }
    };

    const handleDeleteAccount = async (values: { password: string }) => {
        try {
            await deleteAccount.mutateAsync(values);
            message.success('Account deleted');
            setDeleteModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'Failed to delete account');
        }
    };

    return (
        <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    <MailOutlined style={{ marginRight: 8 }} />
                    Change Email
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Current email: <strong>{user?.email}</strong>
                </Text>
                <Form form={emailForm} layout="vertical" onFinish={handleEmailChange}>
                    <Form.Item
                        name="new_email"
                        label="New Email"
                        rules={[
                            { required: true, message: 'Please enter new email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input placeholder="Enter new email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Current Password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password placeholder="Enter current password to confirm" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={changeEmail.isPending}>
                        Change Email
                    </Button>
                </Form>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                    <LockOutlined style={{ marginRight: 8 }} />
                    Change Password
                </Title>
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                    <Form.Item
                        name="current_password"
                        label="Current Password"
                        rules={[{ required: true, message: 'Please enter current password' }]}
                    >
                        <Input.Password placeholder="Enter current password" />
                    </Form.Item>
                    <Form.Item
                        name="new_password"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please enter new password' },
                            { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        label="Confirm New Password"
                        rules={[{ required: true, message: 'Please confirm new password' }]}
                    >
                        <Input.Password placeholder="Confirm new password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
                        Change Password
                    </Button>
                </Form>
            </Card>

            <Card size="small" style={{ border: '1px solid #ff4d4f' }}>
                <Title level={5} style={{ marginTop: 0, color: '#ff4d4f' }}>
                    <DeleteOutlined style={{ marginRight: 8 }} />
                    Delete Account
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Once you delete your account, there is no going back. Please be certain.
                </Text>
                <Button danger onClick={() => setDeleteModalOpen(true)}>
                    Delete Account
                </Button>
            </Card>

            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                        Delete Account
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
                    This action cannot be undone. All your workspaces, boards, and data will be permanently deleted.
                </Text>
                <Form form={deleteForm} layout="vertical" onFinish={handleDeleteAccount}>
                    <Form.Item
                        name="password"
                        label="Enter your password to confirm"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>
                    <Space>
                        <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                        <Button danger type="primary" htmlType="submit" loading={deleteAccount.isPending}>
                            Delete My Account
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </>
    );
}
