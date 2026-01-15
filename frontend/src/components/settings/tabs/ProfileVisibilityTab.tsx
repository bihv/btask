'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Form, Input, Button, Card, Space, Flex, Avatar, message, Upload, Modal, Tabs } from 'antd';
import { EyeOutlined, UserOutlined, CameraOutlined, LoadingOutlined, CheckOutlined } from '@ant-design/icons';
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

// Predefined system avatars (emoji-based for simplicity)
const SYSTEM_AVATARS = [
    // Animals - Cute
    { id: 'cat', emoji: '🐱', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'dog', emoji: '🐶', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'fox', emoji: '🦊', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'panda', emoji: '🐼', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'koala', emoji: '🐨', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'lion', emoji: '🦁', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'unicorn', emoji: '🦄', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'dragon', emoji: '🐲', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'wolf', emoji: '🐺', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'bear', emoji: '🐻', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'rabbit', emoji: '🐰', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'owl', emoji: '🦉', bg: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
    { id: 'penguin', emoji: '🐧', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { id: 'octopus', emoji: '🐙', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'butterfly', emoji: '🦋', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'dolphin', emoji: '🐬', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'tiger', emoji: '🐯', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'monkey', emoji: '🐵', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'elephant', emoji: '🐘', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'giraffe', emoji: '🦒', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'zebra', emoji: '🦓', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'horse', emoji: '🐴', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'pig', emoji: '🐷', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'cow', emoji: '🐮', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'frog', emoji: '🐸', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'snake', emoji: '🐍', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'turtle', emoji: '🐢', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'shark', emoji: '🦈', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'whale', emoji: '🐳', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'bee', emoji: '🐝', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },

    // Space & Nature
    { id: 'rocket', emoji: '🚀', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'star', emoji: '⭐', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'moon', emoji: '🌙', bg: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
    { id: 'sun', emoji: '☀️', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'rainbow', emoji: '🌈', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'fire', emoji: '🔥', bg: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
    { id: 'snowflake', emoji: '❄️', bg: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)' },
    { id: 'lightning', emoji: '⚡', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'earth', emoji: '🌍', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { id: 'saturn', emoji: '🪐', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'ufo', emoji: '🛸', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'comet', emoji: '☄️', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'cloud', emoji: '☁️', bg: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)' },
    { id: 'tree', emoji: '🌳', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'flower', emoji: '🌸', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'mushroom', emoji: '🍄', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },

    // Fun Characters
    { id: 'alien', emoji: '👽', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'robot', emoji: '🤖', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'ghost', emoji: '👻', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'ninja', emoji: '🥷', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'wizard', emoji: '🧙', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'fairy', emoji: '🧚', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'mermaid', emoji: '🧜‍♀️', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'superhero', emoji: '🦸', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'pirate', emoji: '🏴‍☠️', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'clown', emoji: '🤡', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'vampire', emoji: '🧛', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'zombie', emoji: '🧟', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },

    // Objects & Symbols
    { id: 'crown', emoji: '👑', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'diamond', emoji: '💎', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'heart', emoji: '❤️', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'music', emoji: '🎵', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'game', emoji: '🎮', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'coffee', emoji: '☕', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'pizza', emoji: '🍕', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'cake', emoji: '🎂', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'icecream', emoji: '🍦', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'soccer', emoji: '⚽', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'basketball', emoji: '🏀', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'guitar', emoji: '🎸', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'camera', emoji: '📷', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'palette', emoji: '🎨', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'book', emoji: '📚', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'laptop', emoji: '💻', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
];

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

    // Check if avatar is a system emoji avatar
    const isEmojiAvatar = avatarUrl?.startsWith('emoji:');
    const currentEmoji = isEmojiAvatar
        ? SYSTEM_AVATARS.find(a => `emoji:${a.id}` === avatarUrl)
        : null;

    const renderAvatar = () => {
        if (isEmojiAvatar && currentEmoji) {
            return (
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: currentEmoji.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    border: '3px solid rgba(255,255,255,0.8)',
                }}>
                    {currentEmoji.emoji}
                </div>
            );
        }
        return (
            <Avatar
                size={80}
                src={avatarUrl}
                icon={uploading ? <LoadingOutlined /> : <UserOutlined />}
                style={{
                    border: '3px solid rgba(255,255,255,0.8)',
                    backgroundColor: 'rgba(255,255,255,0.2)',
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
