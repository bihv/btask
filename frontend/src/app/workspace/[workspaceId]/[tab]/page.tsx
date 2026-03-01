'use client';

import { useParams } from 'next/navigation';
import { useWorkspace } from '@/hooks/useWorkspaces';
import WorkspaceBoards from '@/components/workspace/WorkspaceBoards';
import WorkspaceMembers from '@/components/workspace/WorkspaceMembers';
import WorkspaceSettings from '@/components/workspace/WorkspaceSettings';
import WorkspacePowerUps from '@/components/workspace/WorkspacePowerUps';

import { Text, Title, Loader, Center } from '@mantine/core';
import { IconApps, IconUsers, IconSettings, IconBolt, IconCurrencyDollar, IconExternalLink } from '@tabler/icons-react';
const tabConfig: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
    billing: {
        title: 'Billing',
        icon: <IconCurrencyDollar size={48} style={{ color: 'var(--text-secondary)' }} />,
        description: 'Manage billing and subscription for this workspace.',
    },
    export: {
        title: 'Export',
        icon: <IconExternalLink size={48} />,
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
                <Loader size="lg" />
            </div>
        );
    }

    if (!workspace) {
        return (
            <Text c="dimmed" ta="center" py="xl">Workspace not found</Text>
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
        return <Text c="dimmed" ta="center" py="xl">Page not found</Text>;
    }

    return (
        <div>
            <Title order={3} style={{ marginBottom: 24 }}>{config.title}</Title>

            <Center py={48}>
                <div style={{ textAlign: 'center' }}>
                    {config.icon}
                    <Title order={5} style={{ marginBottom: 8 }}>{config.title}</Title>
                    <Text c="dimmed">
                        {config.description} Content will be provided later.
                    </Text>
                </div>
            </Center>
        </div>
    );
}
