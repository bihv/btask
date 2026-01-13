'use client';

import React, { useState } from 'react';
import { Input, Button, Space, Avatar, Divider, Typography } from 'antd';
import { UserOutlined, AlignLeftOutlined, EditOutlined } from '@ant-design/icons';
import { Board, User } from '@/types';
import { ScreenHeader } from './MenuShared';

const { Text, Paragraph } = Typography;

interface AboutScreenProps {
    board: Board;
    workspaceMembers: (User & { role?: string })[];
    onBack: () => void;
    onUpdateDescription: (description: string) => Promise<void>;
}

export default function AboutScreen({ board, workspaceMembers, onBack, onUpdateDescription }: AboutScreenProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [descValue, setDescValue] = useState(board.description || '');
    const [saving, setSaving] = useState(false);

    // Find admin (owner) or fallback to first member
    const admin = workspaceMembers.find(m => m.role === 'owner') || workspaceMembers[0];

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdateDescription(descValue);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title="About this board" onBack={onBack} />

            {/* Board Admin */}
            <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <UserOutlined style={{ opacity: 0.6 }} />
                    <Text strong style={{ fontSize: 12 }}>Board Admin</Text>
                </div>
                {admin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 24 }}>
                        <Avatar size={32} style={{ backgroundColor: '#0052cc' }}>
                            {admin.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <div>
                            <div><Text strong style={{ fontSize: 13 }}>{admin.full_name || 'Unknown'}</Text></div>
                            <Text type="secondary" style={{ fontSize: 11 }}>@{admin.email?.split('@')[0]}</Text>
                        </div>
                    </div>
                ) : (
                    <Text type="secondary" style={{ marginLeft: 24, fontSize: 12 }}>
                        No admin information available
                    </Text>
                )}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Description */}
            <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Space size={8}>
                        <AlignLeftOutlined style={{ opacity: 0.6 }} />
                        <Text strong style={{ fontSize: 12 }}>Description</Text>
                    </Space>
                    {!isEditing && (
                        <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
                {isEditing ? (
                    <div style={{ marginLeft: 24 }}>
                        <Input.TextArea
                            value={descValue}
                            onChange={(e) => setDescValue(e.target.value)}
                            rows={3}
                            placeholder="Add a description..."
                            autoFocus
                            style={{ marginBottom: 8 }}
                        />
                        <Space>
                            <Button type="primary" size="small" loading={saving} onClick={handleSave}>
                                Save
                            </Button>
                            <Button size="small" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <div style={{ marginLeft: 24 }}>
                        <Paragraph type={board.description ? undefined : 'secondary'} style={{ fontSize: 13, margin: 0 }}>
                            {board.description || 'No description yet.'}
                        </Paragraph>
                    </div>
                )}
            </div>
        </div>
    );
}
