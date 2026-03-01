'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Text, Title, Card, Divider, Badge, SimpleGrid } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop, IconCircleCheckFilled } from '@tabler/icons-react';
type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeCardProps {
    value: ThemeOption;
    icon: React.ReactNode;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
    previewBg: string;
    previewBorder: string;
}

const ThemeCard: React.FC<ThemeCardProps & { colorPrimary: string; colorBorder: string; colorPrimaryBg: string }> = ({
    icon,
    title,
    description,
    isSelected,
    onClick,
    previewBg,
    previewBorder,
    colorPrimary,
    colorBorder,
    colorPrimaryBg,
}) => (
    <div
        onClick={onClick}
        style={{
            padding: 16,
            borderRadius: 8,
            border: isSelected ? `2px solid ${colorPrimary}` : `1px solid ${colorBorder}`,
            background: isSelected ? colorPrimaryBg : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            height: '100%',
        }}
    >
        {/* Selected checkmark */}
        {isSelected && (
            <IconCircleCheckFilled
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 18,
                    color: colorPrimary,
                }}
            />
        )}

        {/* Preview box */}
        <div
            style={{
                width: '100%',
                height: 60,
                borderRadius: 6,
                background: previewBg,
                border: `1px solid ${previewBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
            }}
        >
            <span style={{ fontSize: 24, color: previewBorder === '#38414a' ? '#b6c2cf' : '#172b4d' }}>
                {icon}
            </span>
        </div>

        {/* Title & description */}
        <Text fw={700} style={{ display: 'block', marginBottom: 4 }}>{title}</Text>
        <Text c="dimmed" style={{ fontSize: 12 }}>{description}</Text>
    </div>
);

export default function ThemeAppearanceSection() {
    const { preference, setTheme } = useTheme();
    const t = useTranslation();
    const token = useAppToken();

    const themeOptions: Omit<ThemeCardProps, 'isSelected' | 'onClick' | 'colorPrimary' | 'colorBorder' | 'colorPrimaryBg'>[] = [
        {
            value: 'light',
            icon: <IconSun size={16} />,
            title: t('UI_THEME_LIGHT'),
            description: t('UI_THEME_LIGHT_DESC'),
            previewBg: '#ffffff',
            previewBorder: '#dfe1e6',
        },
        {
            value: 'dark',
            icon: <IconMoon size={16} />,
            title: t('UI_THEME_DARK'),
            description: t('UI_THEME_DARK_DESC'),
            previewBg: '#1d2125',
            previewBorder: '#38414a',
        },
        {
            value: 'system',
            icon: <IconDeviceDesktop size={16} />,
            title: t('UI_THEME_SYSTEM'),
            description: t('UI_THEME_SYSTEM_DESC'),
            previewBg: 'linear-gradient(135deg, #ffffff 50%, #1d2125 50%)',
            previewBorder: '#9fadbc',
        },
    ];

    return (
        <Card >
            <Text style={{ marginTop: 0, display: 'block', marginBottom: 12 }}>{t('UI_COLOR_MODE')}</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {themeOptions.map((option) => (
                    <div key={option.value}>
                        <ThemeCard
                            {...option}
                            isSelected={preference === option.value}
                            onClick={() => setTheme(option.value as ThemeOption)}
                            colorPrimary={token.colorPrimary}
                            colorBorder="var(--mantine-color-default-border)"
                            colorPrimaryBg="var(--mantine-primary-color-light)"
                        />
                    </div>
                ))}
            </SimpleGrid>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ opacity: 0.5 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_COLOR_SCHEME')}
                    <Badge color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Badge>
                </Text>
                <Text c="dimmed">{t('UI_COLOR_SCHEME_DESC')}</Text>
            </div>
        </Card>
    );
}
