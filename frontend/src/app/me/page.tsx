'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MeSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to profile tab by default
        router.replace('/me/profile');
    }, [router]);

    return null;
}
