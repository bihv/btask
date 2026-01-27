'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Modal, Input, App, Form } from 'antd';
import { PlusOutlined, ProjectOutlined, TeamOutlined, AppstoreOutlined, FileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import { useCreateWorkspace } from '@/hooks/useWorkspaces';
import { CreateWorkspaceRequest } from '@/types';

export default function CreateDropdown() {
    const router = useRouter();
    const { message } = App.useApp();
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [workspaceForm] = Form.useForm();
    const createWorkspaceMutation = useCreateWorkspace();

    const handleCreateBoard = async () => {
        if (!newBoardTitle.trim()) return;
        // For quick create, we'll need to select a workspace first
        // For now, show a message to use workspace page
        message.info('Please create boards from within a workspace');
        setCreateBoardOpen(false);
        setNewBoardTitle('');
    };

    const handleCreateWorkspace = async (values: CreateWorkspaceRequest) => {
        try {
            const workspace = await createWorkspaceMutation.mutateAsync(values);
            setCreateWorkspaceOpen(false);
            workspaceForm.resetFields();
            router.push(`/workspaces/${workspace.id}`);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create workspace');
        }
    };

    const items: MenuProps['items'] = [
        {
            key: 'board',
            icon: <ProjectOutlined />,
            label: 'Create Board',
            onClick: () => setCreateBoardOpen(true),
        },
        {
            key: 'workspace',
            icon: <TeamOutlined />,
            label: 'Create Workspace',
            onClick: () => setCreateWorkspaceOpen(true),
        },
        { type: 'divider' },
        {
            key: 'view',
            icon: <AppstoreOutlined />,
            label: 'Workspace View',
            disabled: true,
            onClick: () => message.info('Coming soon'),
        },
        {
            key: 'template',
            icon: <FileOutlined />,
            label: 'Start with Template',
            disabled: true,
            onClick: () => message.info('Coming soon'),
        },
    ];

    return (
        <>
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                <Button type="primary" icon={<PlusOutlined />}>
                    Create
                </Button>
            </Dropdown>

            {/* Create Board Modal */}
            <Modal
                title="Create Board"
                open={createBoardOpen}
                onOk={handleCreateBoard}
                onCancel={() => {
                    setCreateBoardOpen(false);
                    setNewBoardTitle('');
                }}
                okText="Create"
            >
                <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
                    To create a board, please go to a workspace first.
                </p>
                <Input
                    placeholder="Board title"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    disabled
                />
            </Modal>

            {/* Create Workspace Modal */}
            <Modal
                title="Create Workspace"
                open={createWorkspaceOpen}
                onCancel={() => {
                    setCreateWorkspaceOpen(false);
                    workspaceForm.resetFields();
                }}
                footer={null}
            >
                <Form form={workspaceForm} layout="vertical" onFinish={handleCreateWorkspace}>
                    <Form.Item
                        name="name"
                        label="Workspace Name"
                        rules={[{ required: true, message: 'Please enter a workspace name' }]}
                    >
                        <Input placeholder="e.g., My Team" autoFocus />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Optional description" rows={3} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button
                            onClick={() => {
                                setCreateWorkspaceOpen(false);
                                workspaceForm.resetFields();
                            }}
                            style={{ marginRight: 8 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createWorkspaceMutation.isPending}
                        >
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
