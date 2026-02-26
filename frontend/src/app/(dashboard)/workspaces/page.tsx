'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Modal,
    Form,
    Input,
    Empty,
    Spin,
    App,
    Dropdown,
} from 'antd';
import { PlusOutlined, ProjectOutlined, MoreOutlined, TeamOutlined, SettingOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { CreateWorkspaceRequest } from '@/types';
import { useHeader } from '@/providers/HeaderProvider';
import { useWorkspaces, useDeleteWorkspace } from '@/hooks/useWorkspaces';
import ShareModal from '@/components/workspace/ShareModal';
import { useAuthStore } from '@/stores/authStore';
import type { MenuProps } from 'antd';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function WorkspacesPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();
    const { message, modal } = App.useApp();
    const { user } = useAuthStore();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const deleteWorkspace = useDeleteWorkspace();
    const t = useTranslation();

    // React Query hooks
    const { data: workspaces = [], isLoading } = useWorkspaces();

    const handleMenuClick = (e: React.MouseEvent, workspaceId: string) => {
        e.stopPropagation();
    };

    const handleShare = (workspaceId: string) => {
        setSelectedWorkspaceId(workspaceId);
        setShareModalOpen(true);
    };

    const handleSettings = (workspaceId: string) => {
        router.push(`/workspace/${workspaceId}/settings`);
    };

    const handleDelete = (workspaceId: string, workspaceName: string) => {
        modal.confirm({
            title: t('UI_DELETE_WORKSPACE'),
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete "${workspaceName}"? This will delete all boards in this workspace. This action cannot be undone.`,
            okText: t('UI_DELETE'),
            okType: 'danger',
            cancelText: t('UI_CANCEL'),
            onOk: async () => {
                try {
                    await deleteWorkspace.mutateAsync(workspaceId);
                    message.success(t('UI_WORKSPACE_DELETED'));
                } catch (error: any) {
                    message.error(error.response?.data?.error || t('ERROR_DELETE_WORKSPACE'));
                }
            },
        });
    };

    const getMenuItems = (workspaceId: string, workspaceName: string, ownerId: string): MenuProps['items'] => {
        const isOwner = user?.id === ownerId;

        return [
            {
                key: 'share',
                icon: <TeamOutlined />,
                label: t('UI_SHARE_INVITE'),
                onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleShare(workspaceId);
                },
            },
            {
                key: 'settings',
                icon: <SettingOutlined />,
                label: t('UI_SETTINGS'),
                onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleSettings(workspaceId);
                },
            },
            { type: 'divider' as const },
            {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: t('UI_DELETE'),
                danger: true,
                disabled: !isOwner,
                onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleDelete(workspaceId, workspaceName);
                },
            },
        ];
    };

    // Set dynamic header
    useEffect(() => {
        setHeaderContent(
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>{t('UI_YOUR_WORKSPACES_TITLE')}</Title>

            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent, workspaces.length]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {workspaces.length === 0 ? (
                <Empty
                    description={t('UI_NO_WORKSPACES_YET')}
                    style={{ marginTop: 48 }}
                >
                    <Button type="primary" disabled>
                        {t('UI_USE_CREATE_BUTTON')}
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {workspaces.map((workspace) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={workspace.id}>
                            <Card
                                hoverable
                                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                                style={{ height: '100%', position: 'relative' }}
                            >
                                {/* Menu Button */}
                                <Dropdown
                                    menu={{ items: getMenuItems(workspace.id, workspace.name, workspace.owner_id) }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <Button
                                        type="text"
                                        icon={<MoreOutlined />}
                                        onClick={handleMenuClick}
                                        size="small"
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                        }}
                                    />
                                </Dropdown>
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
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: 18,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {workspace.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ fontSize: 16 }}>
                                            {workspace.name}
                                        </Text>
                                    </div>
                                </div>
                                {workspace.description && (
                                    <Paragraph
                                        type="secondary"
                                        ellipsis={{ rows: 2 }}
                                        style={{ margin: 0 }}
                                    >
                                        {workspace.description}
                                    </Paragraph>
                                )}
                                <div style={{ marginTop: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <ProjectOutlined /> {workspace.board_count ?? 0} boards
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
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
