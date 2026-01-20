'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Modal, Input, App } from 'antd';
import { PlusOutlined, ProjectOutlined, TeamOutlined, AppstoreOutlined, FileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import api from '@/lib/api';

export default function CreateDropdown() {
    const router = useRouter();
    const { message } = App.useApp();
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateBoard = async () => {
        if (!newBoardTitle.trim()) return;
        setLoading(true);
        try {
            // For quick create, we'll need to select a workspace first
            // For now, show a message to use workspace page
            message.info('Please create boards from within a workspace');
            setCreateBoardOpen(false);
            setNewBoardTitle('');
        } catch (error) {
            message.error('Failed to create board');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/workspaces', { name: newWorkspaceName.trim() });
            message.success('Workspace created');
            setCreateWorkspaceOpen(false);
            setNewWorkspaceName('');
            router.push(`/workspaces/${res.data.data.id}`);
        } catch (error) {
            message.error('Failed to create workspace');
        } finally {
            setLoading(false);
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
                confirmLoading={loading}
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
                onOk={handleCreateWorkspace}
                onCancel={() => {
                    setCreateWorkspaceOpen(false);
                    setNewWorkspaceName('');
                }}
                okText="Create"
                confirmLoading={loading}
            >
                <Input
                    placeholder="Workspace name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onPressEnter={handleCreateWorkspace}
                    autoFocus
                />
            </Modal>
        </>
    );
}
