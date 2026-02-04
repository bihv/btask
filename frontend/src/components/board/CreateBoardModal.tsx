'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Empty, Typography } from 'antd';
import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';

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
                title="Create Board"
                open={open}
                onCancel={handleCancel}
                footer={null}
            >
                <Empty
                    description="No workspaces found. Please create a workspace first."
                    style={{ padding: '24px 0' }}
                >
                    {onCreateWorkspace && (
                        <Button type="primary" onClick={onCreateWorkspace}>
                            Create Workspace
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
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        Preview
                    </Text>
                </div>

                {/* Workspace Select (optional) */}
                {showWorkspaceSelect && workspaces && (
                    <Form.Item
                        name="workspace_id"
                        label="Workspace"
                        rules={[{ required: true, message: 'Please select a workspace' }]}
                    >
                        <Select
                            placeholder="Select a workspace"
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
                    label="Board Title"
                    rules={[{ required: true, message: 'Please enter a board title' }]}
                >
                    <Input placeholder="e.g., Project Alpha" autoFocus={!showWorkspaceSelect} />
                </Form.Item>

                {/* Background Picker */}
                <Form.Item label="Background">
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
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Create
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
