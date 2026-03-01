'use client';

import React from 'react';
import { Text, Title, Group, Accordion } from '@mantine/core';
import { IconBellFilled, IconWorld, IconPalette, IconShieldCheck, IconUser } from '@tabler/icons-react';
import {
    AccountSettingsSection,
    NotificationsSection,
    LanguageRegionSection,
    ThemeAppearanceSection,
    SessionsSecuritySection,
} from '../sections';
import { useTranslation } from '@/hooks/useLabels';

export default function SettingsTab() {
    const t = useTranslation();

    return (
        <div>
            <Title order={3} style={{ marginBottom: 24 }}>{t('UI_SETTINGS')}</Title>

            <Accordion
                multiple
                defaultValue={['account', 'notifications', 'region', 'theme', 'security']}
                variant="separated"
            >
                <Accordion.Item value="account">
                    <Accordion.Control icon={<IconUser size={16} />}>
                        <Text fw={700}>{t('UI_ACCOUNT_SETTINGS')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <AccountSettingsSection />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="notifications">
                    <Accordion.Control icon={<IconBellFilled size={16} />}>
                        <Text fw={700}>{t('UI_NOTIFICATIONS')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <NotificationsSection />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="region">
                    <Accordion.Control icon={<IconWorld size={16} />}>
                        <Text fw={700}>{t('UI_LANGUAGE_REGION')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <LanguageRegionSection />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="theme">
                    <Accordion.Control icon={<IconPalette size={16} />}>
                        <Text fw={700}>{t('UI_THEME_APPEARANCE')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <ThemeAppearanceSection />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="security">
                    <Accordion.Control icon={<IconShieldCheck size={16} />}>
                        <Text fw={700}>{t('UI_SESSIONS_SECURITY')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <SessionsSecuritySection />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}
