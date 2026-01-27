'use client';

import React from 'react';
import { Typography, Card, Switch, Divider, Select, Tag, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePreferences } from '@/hooks/useUser';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text } = Typography;

export default function NotificationsSection() {
    const { user } = useAuthStore();
    const updatePreferences = useUpdatePreferences();
    const { message } = App.useApp();
    const t = useTranslation();

    const handlePreferenceChange = async (key: string, value: boolean) => {
        try {
            await updatePreferences.mutateAsync({ [key]: value });
        } catch {
            message.error(t('ERROR_SAVE_PREFERENCE_FAILED'));
        }
    };

    return (
        <Card size="small">
            <Title level={5} style={{ marginTop: 0 }}>{t('UI_EMAIL_NOTIFICATIONS')}</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_WHEN_ASSIGNED')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_NOTIFY_WHEN_ASSIGNED_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_card_assigned ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_card_assigned', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_DUE_DATE')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_NOTIFY_DUE_DATE_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_due_date ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_due_date', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_NEW_COMMENTS')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_NOTIFY_NEW_COMMENTS_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_comment ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_comment', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_MENTIONS')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_NOTIFY_MENTIONS_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_mention ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_mention', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Coming soon items */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, opacity: 0.5 }}>
                <div>
                    <Text>{t('UI_NOTIFY_PUSH')}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_NOTIFY_PUSH_DESC')}</Text>
                </div>
                <Switch disabled />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <div>
                    <Text>{t('UI_EMAIL_DIGEST_FREQUENCY')}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('UI_EMAIL_DIGEST_FREQUENCY_DESC')}</Text>
                </div>
                <Select disabled defaultValue="immediately" style={{ width: 150 }}>
                    <Select.Option value="immediately">{t('UI_IMMEDIATELY')}</Select.Option>
                </Select>
            </div>
        </Card>
    );
}
