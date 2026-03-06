'use client';

import { useTranslation } from '@/hooks/useLabels';

import { Badge, Button, Card, Divider, Text } from '@mantine/core';
export default function SessionsSecuritySection() {
    const t = useTranslation();

    return (
        <Card >
            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_ACTIVE_SESSIONS')}
                    <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
                </Text>
                <Text c="dimmed">{t('UI_ACTIVE_SESSIONS_DESC')}</Text>
            </div>

            <Divider />

            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_TWO_FACTOR_AUTH')}
                    <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
                </Text>
                <Text c="dimmed">{t('UI_TWO_FACTOR_AUTH_DESC')}</Text>
            </div>

            <Divider />

            <div>
                <Text style={{ marginTop: 0, display: 'block' }}>{t('UI_LOGOUT_ALL_DEVICES')}</Text>
                <Text c="dimmed" style={{ display: 'block', marginBottom: 12 }}>
                    {t('UI_LOGOUT_ALL_DEVICES_DESC')}
                </Text>
                <Button disabled>
                    {t('UI_LOGOUT_EVERYWHERE')}
                </Button>
                <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
            </div>
        </Card>
    );
}
