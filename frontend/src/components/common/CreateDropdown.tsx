'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Modal, Input, App, Form } from 'antd';
import { PlusOutlined, ProjectOutlined, TeamOutlined, AppstoreOutlined, FileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import { useCreateWorkspace, useWorkspaces } from '@/hooks/useWorkspaces';
import { CreateWorkspaceRequest } from '@/types';
import api from '@/lib/api';
import CreateBoardModal, { CreateBoardData } from '@/components/board/CreateBoardModal';

export default function CreateDropdown() {
    const router = useRouter();
    const { message } = App.useApp();
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
    const [workspaceForm] = Form.useForm();
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const createWorkspaceMutation = useCreateWorkspace();
    const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();

    const handleCreateBoard = async (data: CreateBoardData) => {
        if (!data.workspace_id) return;
        try {
            setIsCreatingBoard(true);
            const response = await api.post(`/workspaces/${data.workspace_id}/boards`, {
                title: data.title,
                background_color: data.background_color,
                background_image: data.background_image,
            });
            const board = response.data.data;
            message.success('Board created successfully');
            setCreateBoardOpen(false);
            router.push(`/boards/${board.id}`);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        } finally {
            setIsCreatingBoard(false);
        }
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
            <CreateBoardModal
                open={createBoardOpen}
                onCancel={() => setCreateBoardOpen(false)}
                onSubmit={handleCreateBoard}
                loading={isCreatingBoard}
                workspaces={workspaces}
                showWorkspaceSelect={true}
                onCreateWorkspace={() => {
                    setCreateBoardOpen(false);
                    setCreateWorkspaceOpen(true);
                }}
            />

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
