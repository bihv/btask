'use client';

import { useParams } from 'next/navigation';
import { Typography, Empty } from 'antd';
import {
    AppstoreOutlined,
    TeamOutlined,
    SettingOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import SettingsLayout from '@/components/settings/SettingsLayout';

const { Title } = Typography;

// Tabs that should use SettingsLayout
const SETTINGS_TABS = ['boards', 'members', 'settings', 'powerups', 'billing', 'export'];

const tabConfig: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
    boards: {
        title: 'Boards',
        icon: <AppstoreOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'View and manage all boards in this workspace.',
    },
    members: {
        title: 'Members',
        icon: <TeamOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'Manage workspace members and their permissions.',
    },
    settings: {
        title: 'Workspace Settings',
        icon: <SettingOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'Configure workspace settings and preferences.',
    },
    powerups: {
        title: 'Power-Ups',
        icon: <ThunderboltOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />,
        description: 'Enable and manage Power-Ups for this workspace.',
    },
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
    const tab = params.tab as string;
    const workspaceId = params.workspaceId as string;
    const config = tabConfig[tab] || tabConfig.boards;

    const content = (
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

    // Wrap with SettingsLayout for workspace settings tabs
    if (SETTINGS_TABS.includes(tab)) {
        return (
            <SettingsLayout workspaceId={workspaceId}>
                {content}
            </SettingsLayout>
        );
    }

    return content;
}
