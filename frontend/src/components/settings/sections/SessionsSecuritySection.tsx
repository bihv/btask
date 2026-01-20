'use client';

import React from 'react';
import { Typography, Card, Divider, Button, Tag } from 'antd';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

export default function SessionsSecuritySection() {
    const t = useTranslation();

    return (
        <Card size="small">
            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_ACTIVE_SESSIONS')}
                    <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
                </Text>
                <Text type="secondary">{t('UI_ACTIVE_SESSIONS_DESC')}</Text>
            </div>

            <Divider />

            <div style={{ opacity: 0.5, marginBottom: 16 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_TWO_FACTOR_AUTH')}
                    <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
                </Text>
                <Text type="secondary">{t('UI_TWO_FACTOR_AUTH_DESC')}</Text>
            </div>

            <Divider />

            <div>
                <Text style={{ marginTop: 0, display: 'block' }}>{t('UI_LOGOUT_ALL_DEVICES')}</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {t('UI_LOGOUT_ALL_DEVICES_DESC')}
                </Text>
                <Button disabled>
                    {t('UI_LOGOUT_EVERYWHERE')}
                </Button>
                <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
            </div>
        </Card>
    );
}
