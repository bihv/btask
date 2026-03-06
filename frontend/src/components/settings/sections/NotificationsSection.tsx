'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useUpdatePreferences } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/authStore';

import { Badge, Card, Divider, Select, Switch, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
export default function NotificationsSection() {
    const { user } = useAuthStore();
    const updatePreferences = useUpdatePreferences();
    const t = useTranslation();

    const handlePreferenceChange = async (key: string, value: boolean) => {
        try {
            await updatePreferences.mutateAsync({ [key]: value });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_SAVE_PREFERENCE_FAILED'), color: 'red' });
        }
    };

    return (
        <Card >
            <Title order={5} style={{ marginTop: 0 }}>{t('UI_EMAIL_NOTIFICATIONS')}</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_WHEN_ASSIGNED')}</Text>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NOTIFY_WHEN_ASSIGNED_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_card_assigned ?? true}
                    onChange={(e) => handlePreferenceChange('notify_card_assigned', e.currentTarget.checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_DUE_DATE')}</Text>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NOTIFY_DUE_DATE_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_due_date ?? true}
                    onChange={(e) => handlePreferenceChange('notify_due_date', e.currentTarget.checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_NEW_COMMENTS')}</Text>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NOTIFY_NEW_COMMENTS_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_comment ?? true}
                    onChange={(e) => handlePreferenceChange('notify_comment', e.currentTarget.checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>{t('UI_NOTIFY_MENTIONS')}</Text>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NOTIFY_MENTIONS_DESC')}</Text>
                </div>
                <Switch
                    checked={user?.notify_mention ?? true}
                    onChange={(e) => handlePreferenceChange('notify_mention', e.currentTarget.checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Coming soon items */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, opacity: 0.5 }}>
                <div>
                    <Text>{t('UI_NOTIFY_PUSH')}</Text>
                    <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_NOTIFY_PUSH_DESC')}</Text>
                </div>
                <Switch disabled />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <div>
                    <Text>{t('UI_EMAIL_DIGEST_FREQUENCY')}</Text>
                    <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
                    <br />
                    <Text c="dimmed" style={{ fontSize: 12 }}>{t('UI_EMAIL_DIGEST_FREQUENCY_DESC')}</Text>
                </div>
                <Select
                    disabled
                    defaultValue="immediately"
                    style={{ width: 150 }}
                    data={[{ value: 'immediately', label: t('UI_IMMEDIATELY') }]}
                />
            </div>
        </Card>
    );
}
