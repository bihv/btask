'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
