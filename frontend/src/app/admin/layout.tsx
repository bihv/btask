'use client';

import SettingsLayout from '@/components/settings/SettingsLayout';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SettingsLayout isPersonalSettings>
            {children}
        </SettingsLayout>
    );
}
