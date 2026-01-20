'use client';

import React, { useState } from 'react';
import {
    Typography,
    Button,
    Upload,
    Image,
    Popconfirm,
    Space,
    App,
} from 'antd';
import {
    PaperClipOutlined,
    DeleteOutlined,
    DownloadOutlined,
    FileOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    UploadOutlined,
    PictureOutlined,
    CheckCircleFilled,
} from '@ant-design/icons';
import { Attachment } from '@/types';
import { attachmentApi, uploadFile } from '@/lib/api';

const { Text } = Typography;

interface AttachmentSectionProps {
    cardId: string;
    attachments: Attachment[];
    onUpdate: () => void;
    currentCover?: string;
    onSetCover?: (imageUrl: string) => void;
}

const getFileIcon = (fileName: string, fileType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    }
    if (ext === 'pdf') {
        return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
        return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
        return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    }
    return <FileOutlined style={{ fontSize: 24, color: '#666' }} />;
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

export default function AttachmentSection({ cardId, attachments, onUpdate, currentCover, onSetCover }: AttachmentSectionProps) {
    const [uploading, setUploading] = useState(false);
    const { message } = App.useApp();

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
            message.success('File uploaded successfully');
            onUpdate();
        } catch (error) {
            message.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        try {
            await attachmentApi.delete(attachmentId);
            message.success('Attachment deleted');
            onUpdate();
        } catch (error) {
            message.error('Failed to delete attachment');
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
                <PaperClipOutlined />
                <Text strong>Attachments</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>({attachments.length})</Text>
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
                                        width={60}
                                        height={40}
                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                        preview={true}
                                    />
                                ) : (
                                    getFileIcon(attachment.file_name, attachment.file_type)
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
                                    <Text type="secondary" style={{ fontSize: 11 }}>
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
                                        type={currentCover === attachment.file_url ? 'primary' : 'text'}
                                        size="small"
                                        icon={currentCover === attachment.file_url ? <CheckCircleFilled /> : <PictureOutlined />}
                                        onClick={() => onSetCover(attachment.file_url)}
                                        title={currentCover === attachment.file_url ? 'Current Cover' : 'Set as Cover'}
                                    />
                                )}
                                <Button
                                    key="download"
                                    type="text"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                                />
                                <Popconfirm
                                    key="delete"
                                    title="Delete attachment?"
                                    onConfirm={() => handleDelete(attachment.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Upload
                beforeUpload={(file) => {
                    handleUpload(file);
                    return false;
                }}
                showUploadList={false}
                accept="*/*"
            >
                <Button
                    type="dashed"
                    block
                    icon={<UploadOutlined />}
                    loading={uploading}
                    style={{ marginTop: attachments.length > 0 ? 12 : 0 }}
                >
                    Add Attachment
                </Button>
            </Upload>
        </div>
    );
}
