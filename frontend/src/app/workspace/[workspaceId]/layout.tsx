'use client';

import React from 'react';

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Simple passthrough layout for workspace pages
    // Individual tabs handle their own layout (e.g., settings uses SettingsLayout)
    return <>{children}</>;
}
