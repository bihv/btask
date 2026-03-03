'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword, useChangeEmail, useDeleteAccount } from '@/hooks/useUser';
import { useTranslation } from '@/hooks/useLabels';

import { useForm } from '@mantine/form';
import { Text, Title, Card, TextInput, PasswordInput, Button, Group, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock, IconMail, IconTrash, IconAlertCircle } from '@tabler/icons-react';
export default function AccountSettingsSection() {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const { user } = useAuthStore();
    const t = useTranslation();

    const changePassword = useChangePassword();
    const changeEmail = useChangeEmail();
    const deleteAccount = useDeleteAccount();

    const emailForm = useForm({
        initialValues: { new_email: '', password: '' },
    });

    const passwordForm = useForm({
        initialValues: { current_password: '', new_password: '', confirm_password: '' },
    });

    const deleteForm = useForm({
        initialValues: { password: '' },
    });


    const handlePasswordChange = async (values: { current_password: string; new_password: string; confirm_password: string }) => {
        if (values.new_password !== values.confirm_password) {
            notifications.show({ title: 'Error', message: t('ERROR_PASSWORD_MISMATCH'), color: 'red' });
            return;
        }

        try {
            const response = await changePassword.mutateAsync({
                current_password: values.current_password,
                new_password: values.new_password,
            });
            notifications.show({ message: response.message, color: 'green' });
            passwordForm.reset();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            notifications.show({ title: 'Error', message: err.response?.data?.error || t('ERROR_PASSWORD_CHANGE_FAILED'), color: 'red' });
        }
    };

    const handleEmailChange = async (values: { new_email: string; password: string }) => {
        // Frontend validation: new email must differ from current email
        if (user?.email && values.new_email.toLowerCase() === user.email.toLowerCase()) {
            notifications.show({ title: 'Error', message: t('ERROR_EMAIL_SAME_AS_CURRENT'), color: 'red' });
            return;
        }

        try {
            const response = await changeEmail.mutateAsync(values);
            notifications.show({ message: response.message || t('SUCCESS_EMAIL_VERIFICATION_SENT'), color: 'green' });
            emailForm.reset();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            notifications.show({ title: 'Error', message: err.response?.data?.error || t('ERROR_EMAIL_CHANGE_FAILED'), color: 'red' });
        }
    };

    const handleDeleteAccount = async (values: { password: string }) => {
        try {
            const response = await deleteAccount.mutateAsync(values);
            notifications.show({ message: response.message, color: 'green' });
            setDeleteModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            notifications.show({ title: 'Error', message: err.response?.data?.error || t('ERROR_DELETE_ACCOUNT_FAILED'), color: 'red' });
        }
    };

    return (
        <>
            <Card style={{ marginBottom: 16 }}>
                <Title order={5} style={{ marginTop: 0 }}>
                    <IconMail size={16} style={{ marginRight: 8 }} />
                    {t('UI_CHANGE_EMAIL')}
                </Title>
                <Text c="dimmed" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_CURRENT_EMAIL')} <strong>{user?.email}</strong>
                </Text>
                <form onSubmit={emailForm.onSubmit(handleEmailChange)}>
                    <div style={{ marginBottom: 16 }}>
                        <TextInput placeholder={t('UI_PLACEHOLDER_NEW_EMAIL')} {...emailForm.getInputProps('new_email')} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <PasswordInput placeholder={t('UI_PLACEHOLDER_CURRENT_PASSWORD')} {...emailForm.getInputProps('password')} />
                    </div>
                    <Button type="submit" loading={changeEmail.isPending}>
                        {t('UI_CHANGE_EMAIL')}
                    </Button>
                </form>
            </Card>

            <Card style={{ marginBottom: 16 }}>
                <Title order={5} style={{ marginTop: 0 }}>
                    <IconLock size={16} style={{ marginRight: 8 }} />
                    {t('UI_CHANGE_PASSWORD')}
                </Title>
                <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
                    <div style={{ marginBottom: 16 }}>
                        <PasswordInput placeholder={t('UI_PLACEHOLDER_CURRENT_PASSWORD')} {...passwordForm.getInputProps('current_password')} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <PasswordInput placeholder={t('UI_PLACEHOLDER_NEW_PASSWORD')} {...passwordForm.getInputProps('new_password')} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <PasswordInput placeholder={t('UI_PLACEHOLDER_CONFIRM_PASSWORD')} {...passwordForm.getInputProps('confirm_password')} />
                    </div>
                    <Button type="submit" loading={changePassword.isPending}>
                        {t('UI_CHANGE_PASSWORD')}
                    </Button>
                </form>
            </Card>

            <Card style={{ border: '1px solid #ff4d4f' }}>
                <Title order={5} style={{ marginTop: 0, color: '#ff4d4f' }}>
                    <IconTrash size={16} style={{ marginRight: 8 }} />
                    {t('UI_DELETE_ACCOUNT')}
                </Title>
                <Text c="dimmed" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_DELETE_WARNING')}
                </Text>
                <Button color="red" onClick={() => setDeleteModalOpen(true)}>
                    {t('UI_DELETE_ACCOUNT')}
                </Button>
            </Card>

            <Modal
                title={
                    <Group>
                        <IconAlertCircle size={16} style={{ color: '#ff4d4f' }} />
                        {t('UI_DELETE_ACCOUNT')}
                    </Group>
                }
                opened={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    deleteForm.reset();
                }}
            >
                <Text c="dimmed" style={{ display: 'block', marginBottom: 16 }}>
                    {t('UI_DELETE_CONFIRM_WARNING')}
                </Text>
                <form onSubmit={deleteForm.onSubmit(handleDeleteAccount)}>
                    <div style={{ marginBottom: 16 }}>
                        <PasswordInput placeholder={t('UI_PLACEHOLDER_PASSWORD')} {...deleteForm.getInputProps('password')} />
                    </div>
                    <Group>
                        <Button variant="subtle" onClick={() => setDeleteModalOpen(false)}>{t('UI_CANCEL')}</Button>
                        <Button color="red" type="submit" loading={deleteAccount.isPending}>
                            {t('UI_DELETE_MY_ACCOUNT')}
                        </Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}
