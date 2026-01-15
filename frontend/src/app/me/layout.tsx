'use client';

import SettingsLayout from '@/components/settings/SettingsLayout';

export default function MeSettingsLayout({
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
