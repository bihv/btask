'use client';

import { useParams } from 'next/navigation';
import { Typography, Spin, Empty } from 'antd';
import {
    AppstoreOutlined,
    TeamOutlined,
    SettingOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { useWorkspace } from '@/hooks/useWorkspaces';
import WorkspaceBoards from '@/components/workspace/WorkspaceBoards';
import WorkspaceMembers from '@/components/workspace/WorkspaceMembers';
import WorkspaceSettings from '@/components/workspace/WorkspaceSettings';
import WorkspacePowerUps from '@/components/workspace/WorkspacePowerUps';

const { Title } = Typography;

const tabConfig: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
    billing: {
        title: 'Billing',
        icon: <DollarOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'Manage billing and subscription for this workspace.',
    },
    export: {
        title: 'Export',
        icon: <ExportOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'Export workspace data and boards.',
    },
};

export default function WorkspaceSettingsTabPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const tab = params.tab as string;

    const { data: workspace, isLoading } = useWorkspace(workspaceId);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    if (!workspace) {
        return (
            <Empty description="Workspace not found" />
        );
    }

    // Render specific components for implemented tabs
    if (tab === 'boards') {
        return <WorkspaceBoards workspace={workspace} />;
    }

    if (tab === 'members') {
        return <WorkspaceMembers workspace={workspace} />;
    }

    if (tab === 'settings') {
        return <WorkspaceSettings workspace={workspace} />;
    }

    if (tab === 'powerups') {
        return <WorkspacePowerUps workspace={workspace} />;
    }

    // Render placeholder for other tabs
    const config = tabConfig[tab];

    if (!config) {
        return <Empty description="Page not found" />;
    }

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>{config.title}</Title>

            <Empty
                image={config.icon}
                description={
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>{config.title}</Title>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {config.description} Content will be provided later.
                        </span>
                    </div>
                }
            />
        </div>
    );
}
