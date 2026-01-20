'use client';

import { useParams, redirect } from 'next/navigation';
import {
    AccountSettingsSection,
    NotificationsSection,
    LanguageRegionSection,
    ThemeAppearanceSection,
    SessionsSecuritySection,
} from '@/components/settings/sections';

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
