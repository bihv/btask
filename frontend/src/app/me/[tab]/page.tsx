'use client';

import { useParams } from 'next/navigation';
import ProfileVisibilityTab from '@/components/settings/tabs/ProfileVisibilityTab';
import ActivityTab from '@/components/settings/tabs/ActivityTab';
import CardsTab from '@/components/settings/tabs/CardsTab';
import SettingsTab from '@/components/settings/tabs/SettingsTab';

export default function MeSettingsTabPage() {
    const params = useParams();
    const tab = params.tab as string;

    switch (tab) {
        case 'profile':
            return <ProfileVisibilityTab />;
        case 'activity':
            return <ActivityTab />;
        case 'cards':
            return <CardsTab />;
        case 'settings':
            return <SettingsTab />;
        default:
            return <ProfileVisibilityTab />;
    }
}
