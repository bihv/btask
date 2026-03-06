'use client';

import ShareModal from '@/components/workspace/ShareModal';
import { useTranslation } from '@/hooks/useLabels';
import { useDeleteWorkspace, useWorkspaces } from '@/hooks/useWorkspaces';
import { useHeader } from '@/providers/HeaderProvider';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button, Card, Loader, Menu, SimpleGrid, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDots, IconLayoutBoard, IconSettings, IconTrash, IconUsers } from '@tabler/icons-react';

export default function WorkspacesPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();
    const { user } = useAuthStore();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const deleteWorkspace = useDeleteWorkspace();
    const t = useTranslation();

    // React Query hooks
    const { data: workspaces = [], isLoading } = useWorkspaces();

    const handleShare = (workspaceId: string) => {
        setSelectedWorkspaceId(workspaceId);
        setShareModalOpen(true);
    };

    const handleSettings = (workspaceId: string) => {
        router.push(`/workspace/${workspaceId}/settings`);
    };

    const handleDelete = async (workspaceId: string, workspaceName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${workspaceName}"? This will delete all boards in this workspace. This action cannot be undone.`)) return;
        try {
            await deleteWorkspace.mutateAsync(workspaceId);
            notifications.show({ message: t('UI_WORKSPACE_DELETED'), color: 'green' });
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_DELETE_WORKSPACE'), color: 'red' });
        }
    };

    // Set dynamic header
    useEffect(() => {
        setHeaderContent(
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                <Title order={4} style={{ margin: 0 }}>{t('UI_YOUR_WORKSPACES_TITLE')}</Title>

            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent, workspaces.length]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {workspaces.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 48 }}>
                    <Text c="dimmed" mb={16}>{t('UI_NO_WORKSPACES_YET')}</Text>
                    <Button disabled>
                        {t('UI_USE_CREATE_BUTTON')}
                    </Button>
                </div>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {workspaces.map((workspace) => (
                        <div key={workspace.id}>
                            <Card
                                withBorder
                                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                                style={{ height: '100%', position: 'relative' }}
                            >
                                {/* Menu Button */}
                                <Menu shadow="md" position="bottom-end">
                                    <Menu.Target>
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconDots size={16} />}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                            size="sm"
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                            }}
                                        />
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item
                                            leftSection={<IconUsers size={16} />}
                                            onClick={(e) => { e.stopPropagation(); handleShare(workspace.id); }}
                                        >
                                            {t('UI_SHARE_INVITE')}
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={<IconSettings size={16} />}
                                            onClick={(e) => { e.stopPropagation(); handleSettings(workspace.id); }}
                                        >
                                            {t('UI_SETTINGS')}
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item
                                            leftSection={<IconTrash size={16} />}
                                            color="red"
                                            disabled={user?.id !== workspace.owner_id}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(workspace.id, workspace.name); }}
                                        >
                                            {t('UI_DELETE')}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: 18,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {workspace.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text fw={700} style={{ fontSize: 16 }}>
                                            {workspace.name}
                                        </Text>
                                    </div>
                                </div>
                                {workspace.description && (
                                    <Text
                                        c="dimmed"
                                        lineClamp={2}
                                        style={{ margin: 0 }}
                                    >
                                        {workspace.description}
                                    </Text>
                                )}
                                <div style={{ marginTop: 12 }}>
                                    <Text c="dimmed" style={{ fontSize: 12 }}>
                                        <IconLayoutBoard size={16} /> {workspace.board_count ?? 0} boards
                                    </Text>
                                </div>
                            </Card>
                        </div>
                    ))}
                </SimpleGrid>
            )}

            {/* Share Modal */}
            {selectedWorkspaceId && (
                <ShareModal
                    open={shareModalOpen}
                    onClose={() => {
                        setShareModalOpen(false);
                        setSelectedWorkspaceId(null);
                    }}
                    workspaceId={selectedWorkspaceId}
                    isOwner={workspaces.find(w => w.id === selectedWorkspaceId)?.owner_id === user?.id}
                />
            )}
        </div>
    );
}
