'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MeSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to profile tab by default
        router.replace('/me/profile');
    }, [router]);

    return null;
}
