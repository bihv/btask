'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import { attachmentApi, uploadFile } from '@/lib/api';
import { Attachment } from '@/types';
import React, { useState } from 'react';

import { Button, FileButton, Image, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCircleCheckFilled, IconDownload, IconFile, IconFileTypeDoc, IconFileTypePdf, IconFileTypePng, IconFileTypeXls, IconPaperclip, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react';
interface AttachmentSectionProps {
    cardId: string;
    attachments: Attachment[];
    onUpdate: () => void;
    currentCover?: string;
    onSetCover?: (imageUrl: string) => void;
    buttonRef?: React.RefObject<HTMLElement | null>;
}

const getFileIcon = (fileName: string, fileType?: string, colors?: { primary: string; error: string; success: string; muted: string }) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const c = colors || { primary: '#1890ff', error: '#ff4d4f', success: '#52c41a', muted: '#666' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        return <IconFileTypePng size={24} style={{ color: c.primary }} />;
    }
    if (ext === 'pdf') {
        return <IconFileTypePdf size={24} style={{ color: c.error }} />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
        return <IconFileTypeDoc size={24} style={{ color: c.primary }} />;
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
        return <IconFileTypeXls size={24} style={{ color: c.success }} />;
    }
    return <IconFile size={24} />;
};

const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function AttachmentSection({ cardId, attachments, onUpdate, currentCover, onSetCover, buttonRef }: AttachmentSectionProps) {
    const [uploading, setUploading] = useState(false);
    const t = useTranslation();
    const token = useAppToken();
    const fileIconColors = { primary: token.colorPrimary, error: token.colorError, success: token.colorSuccess, muted: token.colorMutedText };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const fileUrl = await uploadFile(file);
            await attachmentApi.create(cardId, {
                file_name: file.name,
                file_url: fileUrl,
                file_type: file.type,
                file_size: file.size,
            });
            notifications.show({ message: t('SUCCESS_FILE_UPLOADED'), color: 'green' });
            onUpdate();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_UPLOAD_FILE'), color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        try {
            await attachmentApi.delete(attachmentId);
            onUpdate();
        } catch (error) {
            notifications.show({ title: 'Error', message: t('ERROR_DELETE_ATTACHMENT'), color: 'red' });
        }
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconPaperclip size={16} />
                <Text fw={700}>{t('UI_ATTACHMENTS')}</Text>
                <Text c="dimmed" style={{ fontSize: 12 }}>({attachments.length})</Text>
            </div>

            {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            style={{
                                padding: '8px 0',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 12,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                {isImageFile(attachment.file_name) ? (
                                    <Image
                                        src={attachment.file_url}
                                        alt={attachment.file_name}
                                        w={60}
                                        h={40}
                                        fit="cover"
                                        radius="sm"
                                    />
                                ) : (
                                    getFileIcon(attachment.file_name, attachment.file_type, fileIconColors)
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        style={{
                                            display: 'block',
                                            wordBreak: 'break-word',
                                            fontSize: 13,
                                        }}
                                    >
                                        {attachment.file_name}
                                    </Text>
                                    <Text c="dimmed" style={{ fontSize: 11 }}>
                                        {attachment.file_size ? formatFileSize(attachment.file_size) : ''}
                                        {attachment.uploader?.full_name && (
                                            <> • {attachment.uploader.full_name}</>
                                        )}
                                    </Text>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isImageFile(attachment.file_name) && onSetCover && (
                                    <Button
                                        key="cover"
                                        variant={currentCover === attachment.file_url ? 'filled' : 'subtle'}
                                        size="sm"
                                        leftSection={currentCover === attachment.file_url ? <IconCircleCheckFilled size={16} /> : <IconPhoto size={16} />}
                                        onClick={() => onSetCover(attachment.file_url)}
                                        title={currentCover === attachment.file_url ? t('UI_CURRENT_COVER') : t('UI_SET_AS_COVER')}
                                    />
                                )}
                                <Button
                                    key="download"
                                    variant="subtle"
                                    size="sm"
                                    leftSection={<IconDownload size={16} />}
                                    onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                                />
                                <Button
                                    key="delete"
                                    title={t('UI_DELETE_ATTACHMENT')}
                                    variant="subtle"
                                    size="sm"
                                    color="red"
                                    onClick={() => handleDelete(attachment.id)}
                                    leftSection={<IconTrash size={16} />}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <FileButton
                onChange={(file) => {
                    if (file) handleUpload(file);
                }}
                accept="*/*"
            >
                {(props) => (
                    <Button
                        {...props}
                        variant="default"
                        fullWidth
                        leftSection={<IconUpload size={16} />}
                        loading={uploading}
                        style={{ marginTop: attachments.length > 0 ? 12 : 0 }}
                        ref={buttonRef as any}
                    >
                        {t('UI_ADD_ATTACHMENT')}
                    </Button>
                )}
            </FileButton>
        </div>
    );
}
