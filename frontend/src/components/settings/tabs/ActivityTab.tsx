'use client';

import { useTranslation } from '@/hooks/useLabels';

import { Center, Text, Title } from '@mantine/core';
export default function ActivityTab() {
    const t = useTranslation();
    return (
        <div>
            <Title order={3} style={{ marginBottom: 24 }}>{t('UI_ACTIVITY')}</Title>

            <Center py={48}>
                <div style={{ textAlign: 'center' }}>
                    <Title order={5} style={{ marginBottom: 8 }}>{t('UI_ACTIVITY')}</Title>
                    <Text c="dimmed">
                        {t('UI_ACTIVITY_DESC')}
                    </Text>
                </div>
            </Center>
        </div>
    );
}
