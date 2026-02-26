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
import { useTranslation } from '@/hooks/useLabels';

export default function CreateDropdown() {
    const router = useRouter();
    const { message } = App.useApp();
    const t = useTranslation();
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
            message.success(t('SUCCESS_BOARD_CREATED'));
            setCreateBoardOpen(false);
            router.push(`/boards/${board.id}`);
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_CREATE_BOARD'));
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
            message.error(error.response?.data?.error || t('ERROR_CREATE_WORKSPACE'));
        }
    };

    const items: MenuProps['items'] = [
        {
            key: 'board',
            icon: <ProjectOutlined />,
            label: t('UI_CREATE_BOARD'),
            onClick: () => setCreateBoardOpen(true),
        },
        {
            key: 'workspace',
            icon: <TeamOutlined />,
            label: t('UI_CREATE_WORKSPACE'),
            onClick: () => setCreateWorkspaceOpen(true),
        },
        { type: 'divider' },
        {
            key: 'view',
            icon: <AppstoreOutlined />,
            label: t('UI_WORKSPACE_VIEW'),
            disabled: true,
            onClick: () => message.info('Coming soon'),
        },
        {
            key: 'template',
            icon: <FileOutlined />,
            label: t('UI_START_WITH_TEMPLATE'),
            disabled: true,
            onClick: () => message.info('Coming soon'),
        },
    ];

    return (
        <>
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                <Button type="primary" icon={<PlusOutlined />}>
                    {t('UI_CREATE')}
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
                title={t('UI_CREATE_WORKSPACE')}
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
                        label={t('UI_WORKSPACE_NAME')}
                        rules={[{ required: true, message: t('VALIDATE_WORKSPACE_NAME_REQ') }]}
                    >
                        <Input placeholder={t('UI_PLACEHOLDER_WORKSPACE_NAME')} autoFocus />
                    </Form.Item>
                    <Form.Item name="description" label={t('UI_DESCRIPTION')}>
                        <Input.TextArea placeholder={t('UI_OPTIONAL_DESCRIPTION')} rows={3} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button
                            onClick={() => {
                                setCreateWorkspaceOpen(false);
                                workspaceForm.resetFields();
                            }}
                            style={{ marginRight: 8 }}
                        >
                            {t('UI_CANCEL')}
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createWorkspaceMutation.isPending}
                        >
                            {t('UI_CREATE')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
