'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Upload, Typography, Spin, App } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { uploadFile } from '@/lib/api';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Text } = Typography;

interface TemplateCardEditModalProps {
    open: boolean;
    card: {
        id: string;
        title: string;
        description?: string;
        cover_url?: string;
    } | null;
    onSave: (card: { id: string; title: string; description?: string; cover_url?: string }) => void;
    onCancel: () => void;
}

export default function TemplateCardEditModal({ open, card, onSave, onCancel }: TemplateCardEditModalProps) {
    const { message } = App.useApp();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (card) {
            setTitle(card.title);
            setDescription(card.description || '');
            setCoverUrl(card.cover_url || '');
        }
    }, [card]);

    const handleSave = () => {
        if (!title.trim()) {
            message.error('Title is required');
            return;
        }
        onSave({
            id: card?.id || '',
            title: title.trim(),
            description,
            cover_url: coverUrl,
        });
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const url = await uploadFile(file);
            setCoverUrl(url);
        } catch (error) {
            message.error('Failed to upload cover');
        } finally {
            setUploading(false);
        }
        return false; // Prevent default upload behavior
    };

    const handleRemoveCover = () => {
        setCoverUrl('');
    };

    return (
        <Modal
            title="Edit Card"
            open={open}
            onCancel={onCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Save
                </Button>,
            ]}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Title</Text>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Card title"
                    />
                </div>

                {/* Cover Image */}
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Cover Image</Text>
                    {coverUrl ? (
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                            <img
                                src={coverUrl}
                                alt="Cover"
                                style={{
                                    width: '100%',
                                    maxHeight: 200,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                }}
                            />
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={handleRemoveCover}
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                    ) : (
                        <Upload
                            beforeUpload={handleUpload}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={uploading}>
                                Upload Cover Image
                            </Button>
                        </Upload>
                    )}
                </div>

                {/* Description */}
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Description</Text>
                    <RichTextEditor
                        key={card?.id || 'new'} 
                        content={description}
                        onChange={setDescription}
                        editable={true}
                        placeholder="Add description..."
                    />
                </div>
            </div>
        </Modal>
    );
}
