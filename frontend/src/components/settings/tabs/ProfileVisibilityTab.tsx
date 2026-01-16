'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Form, Input, Button, Card, Space, Flex, message, Upload, Modal, Tabs } from 'antd';
import { EyeOutlined, CameraOutlined, LoadingOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateUser } from '@/hooks/useUser';
import api from '@/lib/api';
import UserAvatar, { SYSTEM_AVATARS } from '@/components/common/UserAvatar';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ProfileFormValues {
    full_name: string;
    bio: string;
}


export default function ProfileVisibilityTab() {
    const [form] = Form.useForm<ProfileFormValues>();
    const { user } = useAuthStore();
    const updateUser = useUpdateUser();
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
            message.success('Profile updated successfully!');
        } catch (error) {
            message.error('Failed to update profile');
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

            message.success('Avatar uploaded successfully!');
            onSuccess?.(response.data);
            setAvatarModalOpen(false);
        } catch (error) {
            message.error('Failed to upload avatar');
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
            message.success('Avatar updated!');
            setAvatarModalOpen(false);
        } catch (error) {
            message.error('Failed to update avatar');
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
            message.success('Avatar removed!');
            setAvatarModalOpen(false);
        } catch (error) {
            message.error('Failed to remove avatar');
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
            <Title level={3} style={{ marginBottom: 24 }}>Profile and Visibility</Title>

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
                        {user?.full_name || 'User'}
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
                title="Choose Avatar"
                width={480}
            >
                <Tabs
                    defaultActiveKey="system"
                    items={[
                        {
                            key: 'system',
                            label: 'System Avatars',
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
                            label: 'Upload Photo',
                            children: (
                                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                    <Upload
                                        name="avatar"
                                        showUploadList={false}
                                        customRequest={handleAvatarUpload}
                                        accept="image/*"
                                    >
                                        <Button type="primary" loading={uploading}>
                                            {uploading ? 'Uploading...' : 'Choose Image'}
                                        </Button>
                                    </Upload>
                                    <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                                        Recommended: Square image, at least 200x200 pixels
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
                            Remove Avatar
                        </Button>
                    </div>
                )}
            </Modal>

            {/* About Section */}
            <Card>
                <Title level={5} style={{ marginTop: 0 }}>About</Title>

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
                                <span>Full Name *</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Always public</Text>
                                </Space>
                            </Flex>
                        }
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                        <Input placeholder="Enter your full name" />
                    </Form.Item>

                    {/* Bio */}
                    <Form.Item
                        name="bio"
                        label={
                            <Flex justify="space-between" style={{ width: '100%' }}>
                                <span>Bio</span>
                                <Space size={4}>
                                    <EyeOutlined style={{ fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Always public</Text>
                                </Space>
                            </Flex>
                        }
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tell us about yourself"
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    {/* Email (Read-only) */}
                    <Form.Item
                        label="Email"
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
                            Save
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
