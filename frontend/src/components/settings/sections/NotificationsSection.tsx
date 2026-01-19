'use client';

import React from 'react';
import { Typography, Card, Switch, Divider, Select, Tag, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePreferences } from '@/hooks/useUser';

const { Title, Text } = Typography;

export default function NotificationsSection() {
    const { user } = useAuthStore();
    const updatePreferences = useUpdatePreferences();
    const { message } = App.useApp();

    const handlePreferenceChange = async (key: string, value: boolean) => {
        try {
            await updatePreferences.mutateAsync({ [key]: value });
            message.success('Preference saved');
        } catch {
            message.error('Failed to save preference');
        }
    };

    return (
        <Card size="small">
            <Title level={5} style={{ marginTop: 0 }}>Email Notifications</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>When assigned to a card</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Get notified when someone assigns you to a card</Text>
                </div>
                <Switch
                    checked={user?.notify_card_assigned ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_card_assigned', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>Due date reminders</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Get notified when a card's due date is approaching</Text>
                </div>
                <Switch
                    checked={user?.notify_due_date ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_due_date', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>New comments</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Get notified when someone comments on your cards</Text>
                </div>
                <Switch
                    checked={user?.notify_comment ?? true}
                    onChange={(checked) => handlePreferenceChange('notify_comment', checked)}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text>Mentions</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Get notified when someone mentions you</Text>
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
                    <Text>Push notifications</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Receive push notifications in your browser</Text>
                </div>
                <Switch disabled />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <div>
                    <Text>Email digest frequency</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>How often to receive email summaries</Text>
                </div>
                <Select disabled defaultValue="immediately" style={{ width: 150 }}>
                    <Select.Option value="immediately">Immediately</Select.Option>
                </Select>
            </div>
        </Card>
    );
}
