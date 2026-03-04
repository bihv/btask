'use client';

import {
    AccountSettingsSection,
    LanguageRegionSection,
    NotificationsSection,
    SessionsSecuritySection,
    ThemeAppearanceSection,
} from '@/components/settings/sections';
import { redirect, useParams } from 'next/navigation';

export default function SettingsSectionPage() {
    const params = useParams();
    const section = params.section as string;

    switch (section) {
        case 'account':
            return <AccountSettingsSection />;
        case 'notifications':
            return <NotificationsSection />;
        case 'language':
            return <LanguageRegionSection />;
        case 'appearance':
            return <ThemeAppearanceSection />;
        case 'security':
            return <SessionsSecuritySection />;
        default:
            redirect('/me/settings/account');
    }
}
