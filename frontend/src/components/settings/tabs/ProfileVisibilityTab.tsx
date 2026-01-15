'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Form, Input, Button, Card, Space, Flex, Avatar, message, Upload } from 'antd';
import { EyeOutlined, UserOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateUser } from '@/hooks/useUser';
import api from '@/lib/api';

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
        } catch (error) {
            message.error('Failed to upload avatar');
            onError?.(error as Error);
        } finally {
            setUploading(false);
        }
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
                <Upload
                    name="avatar"
                    showUploadList={false}
                    customRequest={handleAvatarUpload}
                    accept="image/*"
                >
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <Avatar
                            size={80}
                            src={avatarUrl}
                            icon={uploading ? <LoadingOutlined /> : <UserOutlined />}
                            style={{
                                border: '3px solid rgba(255,255,255,0.8)',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                            }}
                        />
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
                </Upload>
                <div>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 600, display: 'block' }}>
                        {user?.full_name || 'User'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {user?.email}
                    </Text>
                </div>
            </div>

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
