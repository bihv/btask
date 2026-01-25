'use client';

import React, { useState } from 'react';
import { Modal, Select, Input, Form, App, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useTemplateToBoard } from '@/hooks/useTemplates';
import type { Template } from '@/types';

interface UseTemplateModalProps {
    template: Template;
    open: boolean;
    onClose: () => void;
}

export default function UseTemplateModal({ template, open, onClose }: UseTemplateModalProps) {
    const [form] = Form.useForm();
    const router = useRouter();
    const { message } = App.useApp();
    
    const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
    const { mutate: createFromTemplate, isPending } = useTemplateToBoard();
    
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            if (!selectedWorkspaceId) {
                message.error('Please select a workspace');
                return;
            }

            createFromTemplate(
                {
                    templateId: template.id,
                    workspaceId: selectedWorkspaceId,
                    boardTitle: values.boardTitle || template.title,
                },
                {
                    onSuccess: (board) => {
                        message.success('Board created successfully from template!');
                        onClose();
                        form.resetFields();
                        // Redirect to the new board
                        router.push(`/boards/${board.id}`);
                    },
                    onError: (error: any) => {
                        const errorMsg = error?.response?.data?.message || 'Failed to create board from template';
                        message.error(errorMsg);
                    },
                }
            );
        });
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedWorkspaceId('');
        onClose();
    };

    return (
        <Modal
            title="Use template"
            open={open}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={isPending}
            okText="Create board"
            cancelText="Cancel"
            width={500}
        >
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            background: template.cover_url 
                                ? `url(${template.cover_url}) center/cover` 
                                : template.cover_color || '#0079bf',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {!template.cover_url && (
                            <img 
                                src="/mello-icon-only.svg" 
                                alt="Template" 
                                style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} 
                            />
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{template.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            by {template.author || 'Mello'}
                        </div>
                    </div>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    boardTitle: template.title,
                }}
            >
                <Form.Item
                    label="Workspace"
                    name="workspaceId"
                    rules={[{ required: true, message: 'Please select a workspace' }]}
                >
                    {isLoadingWorkspaces ? (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <Spin size="small" />
                        </div>
                    ) : workspaces.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No workspaces available. Please create a workspace first.
                        </div>
                    ) : (
                        <Select
                            placeholder="Select a workspace"
                            size="large"
                            value={selectedWorkspaceId || undefined}
                            onChange={setSelectedWorkspaceId}
                            options={workspaces.map((ws) => ({
                                label: ws.name,
                                value: ws.id,
                            }))}
                        />
                    )}
                </Form.Item>

                <Form.Item
                    label="Board title"
                    name="boardTitle"
                    rules={[
                        { required: true, message: 'Please enter a board title' },
                        { min: 1, max: 100, message: 'Title must be between 1 and 100 characters' },
                    ]}
                >
                    <Input
                        placeholder="Enter board title"
                        size="large"
                        maxLength={100}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
