'use client';

import CreateBoardModal, { CreateBoardData } from '@/components/board/CreateBoardModal';
import { useTranslation } from '@/hooks/useLabels';
import { useCreateWorkspace, useWorkspaces } from '@/hooks/useWorkspaces';
import api from '@/lib/api';
import { CreateWorkspaceRequest } from '@/types';
import { Button, Group, Menu, Modal, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconApps, IconFile, IconLayoutBoard, IconPlus, IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateDropdown() {
    const router = useRouter();
    const t = useTranslation();
    const [createBoardOpen, setCreateBoardOpen] = useState(false);
    const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const createWorkspaceMutation = useCreateWorkspace();
    const { data: workspaces } = useWorkspaces();

    const form = useForm({
        initialValues: {
            wsName: '',
            wsDescription: '',
        },
        validate: {
            wsName: (value) => (!value.trim() ? t('UI_WORKSPACE_NAME') + ' is required' : null),
        },
    });

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
            notifications.show({ message: t('SUCCESS_BOARD_CREATED'), color: 'green' });
            setCreateBoardOpen(false);
            router.push(`/boards/${board.id}`);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_CREATE_BOARD'), color: 'red' });
        } finally {
            setIsCreatingBoard(false);
        }
    };

    const handleCreateWorkspace = async (values: typeof form.values) => {
        if (!values.wsName.trim()) return;
        try {
            const workspace = await createWorkspaceMutation.mutateAsync({ name: values.wsName, description: values.wsDescription } as CreateWorkspaceRequest);
            setCreateWorkspaceOpen(false);
            form.reset();
            router.push(`/workspaces/${workspace.id}`);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_CREATE_WORKSPACE'), color: 'red' });
        }
    };

    return (
        <>
            <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                    <Button leftSection={<IconPlus size={16} />}>
                        {t('UI_CREATE')}
                    </Button>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={<IconLayoutBoard size={16} />}
                        onClick={() => setCreateBoardOpen(true)}
                    >
                        {t('UI_CREATE_BOARD')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconUsers size={16} />}
                        onClick={() => setCreateWorkspaceOpen(true)}
                    >
                        {t('UI_CREATE_WORKSPACE')}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        leftSection={<IconApps size={16} />}
                        disabled
                    >
                        {t('UI_WORKSPACE_VIEW')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconFile size={16} />}
                        disabled
                    >
                        {t('UI_START_WITH_TEMPLATE')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>

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
                opened={createWorkspaceOpen}
                onClose={() => {
                    setCreateWorkspaceOpen(false);
                    form.reset();
                }}
            >
                <form onSubmit={form.onSubmit(handleCreateWorkspace)}>
                    <TextInput
                        label={t('UI_WORKSPACE_NAME')}
                        placeholder={t('UI_PLACEHOLDER_WORKSPACE_NAME')}
                        required
                        autoFocus
                        mb="md"
                        {...form.getInputProps('wsName')}
                    />
                    <Textarea
                        label={t('UI_DESCRIPTION')}
                        placeholder={t('UI_OPTIONAL_DESCRIPTION')}
                        rows={3}
                        mb="md"
                        {...form.getInputProps('wsDescription')}
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            onClick={() => {
                                setCreateWorkspaceOpen(false);
                                form.reset();
                            }}
                        >
                            {t('UI_CANCEL')}
                        </Button>
                        <Button
                            type="submit"
                            loading={createWorkspaceMutation.isPending}
                        >
                            {t('UI_CREATE')}
                        </Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}
