'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Empty, Typography } from 'antd';
import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

const { Text } = Typography;

// Default background
const DEFAULT_BACKGROUND = SOLID_COLORS[0];

export interface CreateBoardData {
    title: string;
    background_color: string;
    background_image: string;
    workspace_id?: string;
}

interface Workspace {
    id: string;
    name: string;
}

interface CreateBoardModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (data: CreateBoardData) => Promise<void>;
    loading?: boolean;
    // Optional: for workspace selection mode (used in header dropdown)
    workspaces?: Workspace[];
    showWorkspaceSelect?: boolean;
    onCreateWorkspace?: () => void;
}

export default function CreateBoardModal({
    open,
    onCancel,
    onSubmit,
    loading = false,
    workspaces,
    showWorkspaceSelect = false,
    onCreateWorkspace,
}: CreateBoardModalProps) {
    const t = useTranslation();
    const token = useAppToken();
    const [form] = Form.useForm();
    const [selectedBackground, setSelectedBackground] = useState(DEFAULT_BACKGROUND);
    const [selectedImage, setSelectedImage] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.resetFields();
            setSelectedBackground(DEFAULT_BACKGROUND);
            setSelectedImage('');
        }
    }, [open, form]);

    const handleSubmit = async (values: { title: string; workspace_id?: string }) => {
        await onSubmit({
            title: values.title,
            background_color: selectedImage ? '' : selectedBackground,
            background_image: selectedImage,
            workspace_id: values.workspace_id,
        });
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedBackground(DEFAULT_BACKGROUND);
        setSelectedImage('');
        onCancel();
    };

    // If workspace selection is required but no workspaces available
    if (showWorkspaceSelect && (!workspaces || workspaces.length === 0)) {
        return (
            <Modal
                title={t('UI_CREATE_BOARD')}
                open={open}
                onCancel={handleCancel}
                footer={null}
            >
                <Empty
                    description={t('UI_NO_WORKSPACES')}
                    style={{ padding: '24px 0' }}
                >
                    {onCreateWorkspace && (
                        <Button type="primary" onClick={onCreateWorkspace}>
                            {t('UI_CREATE_WORKSPACE')}
                        </Button>
                    )}
                </Empty>
            </Modal>
        );
    }

    return (
        <Modal
            title="Create Board"
            open={open}
            onCancel={handleCancel}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                {/* Preview */}
                <div
                    style={{
                        height: 100,
                        borderRadius: 8,
                        marginBottom: 16,
                        background: selectedImage
                            ? `url(${selectedImage}) center/cover`
                            : selectedBackground,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: token.colorWhite, fontSize: 18, fontWeight: 600, textShadow: `0 1px 2px ${token.colorOverlayDark}` }}>
                        {t('UI_PREVIEW')}
                    </Text>
                </div>

                {/* Workspace Select (optional) */}
                {showWorkspaceSelect && workspaces && (
                    <Form.Item
                        name="workspace_id"
                        label={t('UI_WORKSPACE')}
                        rules={[{ required: true, message: t('UI_REQUIRED_SELECT_WORKSPACE') }]}
                    >
                        <Select
                            placeholder={t('UI_PLACEHOLDER_SELECT_WORKSPACE')}
                            options={workspaces.map((ws) => ({
                                value: ws.id,
                                label: ws.name,
                            }))}
                        />
                    </Form.Item>
                )}

                {/* Board Title */}
                <Form.Item
                    name="title"
                    label={t('UI_BOARD_TITLE')}
                    rules={[{ required: true, message: t('UI_REQUIRED_BOARD_TITLE') }]}
                >
                    <Input placeholder="e.g., Project Alpha" autoFocus={!showWorkspaceSelect} />
                </Form.Item>

                {/* Background Picker */}
                <Form.Item label={t('UI_BACKGROUND')}>
                    <BackgroundPicker
                        value={selectedBackground}
                        imageValue={selectedImage}
                        onChange={setSelectedBackground}
                        onImageChange={setSelectedImage}
                    />
                </Form.Item>

                {/* Actions */}
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                        {t('UI_CANCEL')}
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {t('UI_CREATE')}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
