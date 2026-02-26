'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Form, Input, Button, Card, Space, Flex, Upload, Modal, Tabs, App } from 'antd';
import { EyeOutlined, CameraOutlined, LoadingOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateUser } from '@/hooks/useUser';
import api from '@/lib/api';
import UserAvatar, { SYSTEM_AVATARS } from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ProfileFormValues {
    full_name: string;
    bio: string;
}


export default function ProfileVisibilityTab() {
    const [form] = Form.useForm<ProfileFormValues>();
    const { message } = App.useApp();
    const { user } = useAuthStore();
    const updateUser = useUpdateUser();
    const t = useTranslation();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url);
    const [uploading, setUploading] = useState(false);
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);

    // Set form values when user data is available
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                full_name: user.full_name || '',
                bio: user.bio || '',
            });
            setAvatarUrl(user.avatar_url);
        }
    }, [user, form]);

    const handleSubmit = async (values: ProfileFormValues) => {
        try {
            await updateUser.mutateAsync({
                full_name: values.full_name,
                bio: values.bio,
                avatar_url: avatarUrl,
            });
        } catch (error) {
            message.error(t('ERROR_UPDATE_PROFILE'));
        }
    };

    const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError } = options;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file as File);

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

            onSuccess?.(response.data);
            setAvatarModalOpen(false);
        } catch (error) {
            message.error(t('ERROR_UPLOAD_AVATAR'));
            onError?.(error as Error);
        } finally {
            setUploading(false);
        }
    };

    const handleSelectSystemAvatar = async (avatar: typeof SYSTEM_AVATARS[0]) => {
        // Use emoji as avatar identifier (prefixed with 'emoji:')
        const avatarValue = `emoji:${avatar.id}`;
        setAvatarUrl(avatarValue);

        try {
            await updateUser.mutateAsync({ avatar_url: avatarValue });
            setAvatarModalOpen(false);
        } catch (error) {
            message.error(t('ERROR_UPDATE_AVATAR'));
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            // Send with other fields to ensure request is not stripped
            await updateUser.mutateAsync({
                full_name: user?.full_name || '',
                bio: user?.bio || '',
                avatar_url: '',
            });
            setAvatarUrl(undefined);
            setAvatarModalOpen(false);
        } catch (error) {
            message.error(t('ERROR_REMOVE_AVATAR'));
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
                    <LoadingOutlined style={{ fontSize: 24, color: '#fff' }} />
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
            <Title level={3} style={{ marginBottom: 24 }}>{t('UI_PROFILE_VISIBILITY')}</Title>

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
                        <CameraOutlined style={{ fontSize: 14, color: '#333' }} />
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
                open={avatarModalOpen}
                onCancel={() => setAvatarModalOpen(false)}
                footer={null}
                title={t('UI_CHOOSE_AVATAR')}
                width={480}
            >
                <Tabs
                    defaultActiveKey="system"
                    items={[
                        {
                            key: 'system',
                            label: t('UI_SYSTEM_AVATARS'),
                            children: (
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
                                                    <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ),
                        },
                        {
                            key: 'upload',
                            label: t('UI_UPLOAD_PHOTO'),
                            children: (
                                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                    <Upload
                                        name="avatar"
                                        showUploadList={false}
                                        customRequest={handleAvatarUpload}
                                        accept="image/*"
                                    >
                                        <Button type="primary" loading={uploading}>
                                            {uploading ? t('UI_UPLOADING') : t('UI_CHOOSE_IMAGE')}
                                        </Button>
                                    </Upload>
                                    <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                                        {t('UI_AVATAR_RECOMMENDATION')}
                                    </Text>
                                </div>
                            ),
                        },
                    ]}
                />

                {/* Remove Avatar Button */}
                {avatarUrl && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleRemoveAvatar}
                            block
                        >
                            {t('UI_REMOVE_AVATAR')}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* About Section */}
            <Card>
                <Title level={5} style={{ marginTop: 0 }}>{t('UI_ABOUT')}</Title>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    {/* Full Name */}
                    <Form.Item
                        name="full_name"
                        label={
                            <Flex justify="space-between" style={{ width: '100%' }}>
                                <span>{t('UI_FULL_NAME')}</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_ALWAYS_PUBLIC')}</Text>
                                </Space>
                            </Flex>
                        }
                        rules={[{ required: true, message: t('VALIDATE_FULL_NAME') }]}
                    >
                        <Input placeholder={t('UI_PLACEHOLDER_FULL_NAME')} />
                    </Form.Item>

                    {/* Bio */}
                    <Form.Item
                        name="bio"
                        label={
                            <Flex justify="space-between" style={{ width: '100%' }}>
                                <span>{t('UI_BIO')}</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_ALWAYS_PUBLIC')}</Text>
                                </Space>
                            </Flex>
                        }
                    >
                        <TextArea
                            rows={4}
                            placeholder={t('UI_PLACEHOLDER_BIO')}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    {/* Email (Read-only) */}
                    <Form.Item
                        label={t('UI_EMAIL')}
                    >
                        <Input value={user?.email} disabled />
                    </Form.Item>

                    {/* Save Button */}
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={updateUser.isPending}
                        >
                            {t('UI_SAVE')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
