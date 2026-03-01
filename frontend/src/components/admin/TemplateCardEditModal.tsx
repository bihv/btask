'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { uploadFile } from '@/lib/api';

import { Modal, TextInput, Button, FileButton, Text, Title, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconTrash } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

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
            notifications.show({ title: 'Error', message: 'Title is required', color: 'red' });
            return;
        }
        onSave({
            id: card?.id || '',
            title: title.trim(),
            description,
            cover_url: coverUrl,
        });
    };

    const handleUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadFile(file);
            setCoverUrl(url);
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to upload cover', color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveCover = () => {
        setCoverUrl('');
    };

    return (
        <Modal
            title="Edit Card"
            opened={open}
            onClose={onCancel}
            size="lg"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                    <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>Title</Text>
                    <TextInput
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Card title"
                    />
                </div>

                {/* Cover Image */}
                <div>
                    <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>Cover Image</Text>
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
                                color="red"
                                size="sm"
                                leftSection={<IconTrash size={16} />}
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
                        <FileButton onChange={handleUpload} accept="image/*">
                            {(props) => (
                                <Button {...props} leftSection={<IconUpload size={16} />} loading={uploading}>
                                    Upload Cover Image
                                </Button>
                            )}
                        </FileButton>
                    )}
                </div>

                {/* Description */}
                <div>
                    <Text fw={700} style={{ display: 'block', marginBottom: 8 }}>Description</Text>
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
