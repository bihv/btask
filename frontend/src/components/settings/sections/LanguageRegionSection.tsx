'use client';

import React from 'react';
import { Card, Form, Select, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePreferences } from '@/hooks/useUser';
import { useTranslation, useInvalidateLabels } from '@/hooks/useLabels';

const TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'America/New_York', label: 'America/New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (GMT-8)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
];

const DATE_FORMATS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
];

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
];

export default function LanguageRegionSection() {
    const { user } = useAuthStore();
    const updatePreferences = useUpdatePreferences();
    const t = useTranslation();
    const invalidateLabels = useInvalidateLabels();
    const { message } = App.useApp();

    const handlePreferenceChange = async (key: string, value: string) => {
        try {
            await updatePreferences.mutateAsync({ [key]: value });

            // Refresh labels when language changes, then show message in new language
            if (key === 'language') {
                // Invalidate will trigger refetch and return fresh translation function
                const freshT = await invalidateLabels();
                message.success(freshT('SUCCESS_PREFERENCE_SAVED'));
            } else {
                message.success(t('SUCCESS_PREFERENCE_SAVED'));
            }
        } catch {
            message.error(t('ERROR_SAVE_PREFERENCE_FAILED'));
        }
    };

    return (
        <Card size="small">
            <Form layout="vertical">
                <Form.Item label={t('UI_LANGUAGE')}>
                    <Select
                        value={user?.language || 'en'}
                        onChange={(value) => handlePreferenceChange('language', value)}
                        options={LANGUAGES}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item label={t('UI_TIMEZONE')}>
                    <Select
                        value={user?.timezone || 'UTC'}
                        onChange={(value) => handlePreferenceChange('timezone', value)}
                        options={TIMEZONES}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item label={t('UI_DATE_FORMAT')} style={{ marginBottom: 0 }}>
                    <Select
                        value={user?.date_format || 'DD/MM/YYYY'}
                        onChange={(value) => handlePreferenceChange('date_format', value)}
                        options={DATE_FORMATS}
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            </Form>
        </Card>
    );
}
