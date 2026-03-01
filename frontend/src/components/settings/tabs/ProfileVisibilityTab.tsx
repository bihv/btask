'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateUser } from '@/hooks/useUser';
import api from '@/lib/api';
import UserAvatar, { SYSTEM_AVATARS } from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, TextInput, Textarea, Button, Card, Group, Flex, FileButton, Modal, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCamera, IconLoader, IconCheck, IconTrash } from '@tabler/icons-react';

import { useForm } from '@mantine/form';

interface ProfileFormValues {
    full_name: string;
    bio: string;
}

export default function ProfileVisibilityTab() {
    const { user } = useAuthStore();
    const updateUser = useUpdateUser();
    const t = useTranslation();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url);
    const [uploading, setUploading] = useState(false);
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);
    const form = useForm({
        initialValues: {
            full_name: '',
            bio: '',
        }
    });

    // Set form values when user data is available
    useEffect(() => {
        if (user) {
            form.setValues({
                full_name: user.full_name || '',
                bio: user.bio || '',
            });
            setAvatarUrl(user.avatar_url);
        }
    }, [user]);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            await updateUser.mutateAsync({
                full_name: values.full_name,
                bio: values.bio,
                avatar_url: avatarUrl,
            });
            notifications.show({ message: t('UI_PROFILE_UPDATED'), color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_PROFILE'), color: 'red' });
        }
    };

    const handleAvatarUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedUrl = response.data.data.url;
            setAvatarUrl(uploadedUrl);

            // Auto-save avatar
            await updateUser.mutateAsync({ avatar_url: uploadedUrl });
            setAvatarModalOpen(false);
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPLOAD_AVATAR'), color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    const handleSelectSystemAvatar = async (avatar: typeof SYSTEM_AVATARS[0]) => {
        const avatarValue = `emoji:${avatar.id}`;
        setAvatarUrl(avatarValue);

        try {
            await updateUser.mutateAsync({ avatar_url: avatarValue });
            setAvatarModalOpen(false);
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_AVATAR'), color: 'red' });
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            await updateUser.mutateAsync({
                full_name: user?.full_name || '',
                bio: user?.bio || '',
                avatar_url: '',
            });
            setAvatarUrl(undefined);
            setAvatarModalOpen(false);
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_REMOVE_AVATAR'), color: 'red' });
        }
    };

    const renderAvatar = () => {
        if (uploading) {
            return (
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid rgba(255,255,255,0.8)',
                }}>
                    <IconLoader size={24} />
                </div>
            );
        }
        return (
            <UserAvatar
                avatarUrl={avatarUrl}
                name={user?.full_name}
                size={80}
                style={{
                    border: '3px solid rgba(255,255,255,0.8)',
                }}
            />
        );
    };

    return (
        <div>
            <Title order={3} style={{ marginBottom: 24 }}>{t('UI_PROFILE_VISIBILITY')}</Title>

            {/* Profile Header with Avatar */}
            <div style={{
                width: '100%',
                padding: 24,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
            }}>
                <div
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => setAvatarModalOpen(true)}
                >
                    {renderAvatar()}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
                        <IconCamera size={14} style={{ color: '#333' }} />
                    </div>
                </div>
                <div>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 600, display: 'block' }}>
                        {user?.full_name || t('UI_USER')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {user?.email}
                    </Text>
                </div>
            </div>

            {/* Avatar Selection Modal */}
            <Modal
                opened={avatarModalOpen}
                onClose={() => setAvatarModalOpen(false)}
                title={t('UI_CHOOSE_AVATAR')}
                size="lg"
            >
                <Tabs defaultValue="system">
                    <Tabs.List>
                        <Tabs.Tab value="system">{t('UI_SYSTEM_AVATARS')}</Tabs.Tab>
                        <Tabs.Tab value="upload">{t('UI_UPLOAD_PHOTO')}</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="system" pt="md">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: 12,
                            padding: '16px 0',
                            maxHeight: 300,
                            overflowY: 'auto',
                        }}>
                            {SYSTEM_AVATARS.map((avatar) => (
                                <div
                                    key={avatar.id}
                                    onClick={() => handleSelectSystemAvatar(avatar)}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: avatar.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 28,
                                        cursor: 'pointer',
                                        outline: avatarUrl === `emoji:${avatar.id}`
                                            ? '3px solid #1890ff'
                                            : 'none',
                                        outlineOffset: 2,
                                        position: 'relative',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {avatar.emoji}
                                    {avatarUrl === `emoji:${avatar.id}` && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: -2,
                                            right: -2,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: '#1890ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <IconCheck size={12} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="upload" pt="md">
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <FileButton onChange={handleAvatarUpload} accept="image/*">
                                {(props) => (
                                    <Button {...props} loading={uploading}>
                                        {uploading ? t('UI_UPLOADING') : t('UI_CHOOSE_IMAGE')}
                                    </Button>
                                )}
                            </FileButton>
                            <Text c="dimmed" style={{ display: 'block', marginTop: 12 }}>
                                {t('UI_AVATAR_RECOMMENDATION')}
                            </Text>
                        </div>
                    </Tabs.Panel>
                </Tabs>

                {/* Remove Avatar Button */}
                {avatarUrl && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                        <Button
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={handleRemoveAvatar}
                            fullWidth
                        >
                            {t('UI_REMOVE_AVATAR')}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* About Section */}
            <Card>
                <Title order={5} style={{ marginTop: 0 }}>{t('UI_ABOUT')}</Title>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {/* Full Name */}
                    <div style={{ marginBottom: 16 }}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <span>{t('UI_FULL_NAME')}</span>
                            <Group gap={4}>
                                <IconEye size={12} />
                                <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_ALWAYS_PUBLIC')}</Text>
                            </Group>
                        </Flex>
                        <TextInput
                            placeholder={t('UI_PLACEHOLDER_FULL_NAME')}
                            {...form.getInputProps('full_name')}
                        />
                    </div>

                    {/* Bio */}
                    <div style={{ marginBottom: 16 }}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <span>{t('UI_BIO')}</span>
                            <Group gap={4}>
                                <IconEye size={12} />
                                <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_ALWAYS_PUBLIC')}</Text>
                            </Group>
                        </Flex>
                        <Textarea
                            rows={4}
                            placeholder={t('UI_PLACEHOLDER_BIO')}
                            maxLength={500}
                            {...form.getInputProps('bio')}
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div style={{ marginBottom: 16 }}>
                        <TextInput value={user?.email} disabled />
                    </div>

                    {/* Save Button */}
                    <div>
                        <Button
                            type="submit"
                            loading={updateUser.isPending}
                        >
                            {t('UI_SAVE')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
