'use client';

import React from 'react';
import { Modal, Button, Upload, Typography, Divider, App } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import api, { uploadFile } from '@/lib/api';
import { extractDominantColor } from '@/utils/extractColor';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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
    const { message } = App.useApp();
    const t = useTranslation();

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
            message.error(t('ERROR_UPDATE_COVER'));
        }
    };

    return (
        <Modal
            title={t('UI_CHOOSE_COVER')}
            open={open}
            onCancel={onClose}
            footer={null}
            width={360}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Image attachments grid */}
                {imageAttachments.length > 0 && (
                    <>
                        <Text type="secondary" style={{ fontSize: 12 }}>
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
                                                ? '2px solid #1890ff'
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
                <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={async (file) => {
                        try {
                            message.loading(t('UI_UPLOADING'), 0);
                            const url = await uploadFile(file);
                            message.destroy();
                            await handleSetCover(url);
                        } catch {
                            message.destroy();
                            message.error(t('ERROR_UPLOAD_FAILED'));
                        }
                        return false;
                    }}
                >
                    <Button type="dashed" block icon={<PictureOutlined />}>
                        {t('UI_UPLOAD_IMAGE')}
                    </Button>
                </Upload>

                {currentCover && (
                    <>
                        <Divider style={{ margin: 0 }} />
                        <Button
                            type="text"
                            danger
                            block
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
