'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WorkspaceSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    useEffect(() => {
        // Redirect to boards tab by default
        router.replace(`/workspace/${workspaceId}/boards`);
    }, [router, workspaceId]);

    return null;
}
