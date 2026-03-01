'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Center } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
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
