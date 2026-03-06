'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import api, { uploadFile } from '@/lib/api';
import { extractDominantColor } from '@/utils/extractColor';
import { useState } from 'react';

import { Button, Divider, FileButton, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
interface Attachment {
    file_url: string;
    file_name: string;
}

interface CoverImagePickerModalProps {
    open: boolean;
    onClose: () => void;
    cardId: string;
    attachments: Attachment[];
    currentCover: string | undefined;
    onUpdate: (coverImage: string) => void;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export default function CoverImagePickerModal({
    open,
    onClose,
    cardId,
    attachments,
    currentCover,
    onUpdate,
}: CoverImagePickerModalProps) {
    const t = useTranslation();
    const token = useAppToken();
    const [uploading, setUploading] = useState(false);

    const imageAttachments = attachments.filter((a) =>
        IMAGE_EXTENSIONS.some((ext) => a.file_name.toLowerCase().endsWith(ext))
    );

    const handleSetCover = async (url: string) => {
        try {
            // If same cover, remove it
            const newCover = currentCover === url ? '' : url;

            // Extract dominant color from image for background
            let bgColor = '';
            if (newCover) {
                try {
                    bgColor = await extractDominantColor(newCover);
                } catch {
                    bgColor = 'rgb(128, 128, 128)'; // Default gray
                }
            }

            await api.put(`/cards/${cardId}`, {
                cover_image: newCover,
                cover_bg_color: bgColor,
            });
            onUpdate(newCover);
            onClose();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_COVER'), color: 'red' });
        }
    };

    return (
        <Modal
            title={t('UI_CHOOSE_COVER')}
            opened={open}
            onClose={onClose}
            size={360}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Image attachments grid */}
                {imageAttachments.length > 0 && (
                    <>
                        <Text c="dimmed" style={{ fontSize: 12 }}>
                            {t('UI_FROM_ATTACHMENTS')}
                        </Text>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 8,
                            }}
                        >
                            {imageAttachments.map((a) => (
                                <div
                                    key={a.file_url}
                                    onClick={() => handleSetCover(a.file_url)}
                                    style={{
                                        width: '100%',
                                        paddingBottom: '75%',
                                        position: 'relative',
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border:
                                            currentCover === a.file_url
                                                ? `2px solid ${token.colorPrimary}`
                                                : '1px solid var(--border-color)',
                                    }}
                                >
                                    <img
                                        src={a.file_url}
                                        alt={a.file_name}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Upload new image */}
                <FileButton
                    accept="image/*"
                    onChange={async (file) => {
                        if (!file) return;
                        try {
                            setUploading(true);
                            const url = await uploadFile(file);
                            await handleSetCover(url);
                        } catch {
                            notifications.show({ title: 'Error', message: t('ERROR_UPLOAD_FAILED'), color: 'red' });
                        } finally {
                            setUploading(false);
                        }
                    }}
                >
                    {(props) => (
                        <Button {...props} variant="default" fullWidth leftSection={<IconPhoto size={16} />} loading={uploading}>
                            {t('UI_UPLOAD_IMAGE')}
                        </Button>
                    )}
                </FileButton>

                {currentCover && (
                    <>
                        <Divider style={{ margin: 0 }} />
                        <Button
                            variant="subtle"
                            color="red"
                            fullWidth
                            onClick={() => handleSetCover('')}
                        >
                            {t('UI_REMOVE_COVER')}
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
}
