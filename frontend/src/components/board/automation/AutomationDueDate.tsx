'use client';

import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Button, Flex } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';

export default function AutomationDueDate() {
    const t = useTranslation();

    return (
        <Flex direction="column" align="center" justify="center" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Flex
                align="center"
                justify="center"
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-default-hover)',
                    marginBottom: 24
                }}
            >
                <IconCalendar size={40} />
            </Flex>

            <Title order={3}>{t('UI_DUE_DATE_AUTOMATION')}</Title>
            <Text c="dimmed" style={{ maxWidth: 500, marginBottom: 32 }}>
                {t('UI_DUE_DATE_DESCRIPTION')}
            </Text>

            <Button size="lg" disabled>
                {t('UI_CREATE_DUE_DATE')}
            </Button>
            <Text c="dimmed" style={{ marginTop: 16, fontSize: 12 }}>
                {t('UI_COMING_SOON')}
            </Text>
        </Flex>
    );
}
