'use client';

import { useParams, redirect } from 'next/navigation';
import ProfileVisibilityTab from '@/components/settings/tabs/ProfileVisibilityTab';
import ActivityTab from '@/components/settings/tabs/ActivityTab';
import CardsTab from '@/components/settings/tabs/CardsTab';

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
            // Redirect to new nested settings route
            redirect('/me/settings/account');
        default:
            return <ProfileVisibilityTab />;
    }
}
