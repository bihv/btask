'use client';

import SettingsLayout from '@/components/settings/SettingsLayout';
import { useParams } from 'next/navigation';

export default function WorkspaceSettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    return (
        <SettingsLayout workspaceId={workspaceId}>
            {children}
        </SettingsLayout>
    );
}
