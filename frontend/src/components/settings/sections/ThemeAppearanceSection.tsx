'use client';

import React from 'react';
import { Typography, Card, Divider, Tag, Row, Col } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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

const ThemeCard: React.FC<ThemeCardProps> = ({
    icon,
    title,
    description,
    isSelected,
    onClick,
    previewBg,
    previewBorder,
}) => (
    <div
        onClick={onClick}
        style={{
            padding: 16,
            borderRadius: 8,
            border: isSelected ? '2px solid var(--ant-color-primary)' : '1px solid var(--ant-color-border)',
            background: isSelected ? 'var(--ant-color-primary-bg)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            height: '100%',
        }}
    >
        {/* Selected checkmark */}
        {isSelected && (
            <CheckCircleFilled
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 18,
                    color: 'var(--ant-color-primary)',
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
        <Text strong style={{ display: 'block', marginBottom: 4 }}>{title}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>
    </div>
);

export default function ThemeAppearanceSection() {
    const { preference, setTheme } = useTheme();
    const t = useTranslation();

    const themeOptions: Omit<ThemeCardProps, 'isSelected' | 'onClick'>[] = [
        {
            value: 'light',
            icon: <SunOutlined />,
            title: t('UI_THEME_LIGHT'),
            description: t('UI_THEME_LIGHT_DESC'),
            previewBg: '#ffffff',
            previewBorder: '#dfe1e6',
        },
        {
            value: 'dark',
            icon: <MoonOutlined />,
            title: t('UI_THEME_DARK'),
            description: t('UI_THEME_DARK_DESC'),
            previewBg: '#1d2125',
            previewBorder: '#38414a',
        },
        {
            value: 'system',
            icon: <DesktopOutlined />,
            title: t('UI_THEME_SYSTEM'),
            description: t('UI_THEME_SYSTEM_DESC'),
            previewBg: 'linear-gradient(135deg, #ffffff 50%, #1d2125 50%)',
            previewBorder: '#9fadbc',
        },
    ];

    return (
        <Card size="small">
            <Text style={{ marginTop: 0, display: 'block', marginBottom: 12 }}>{t('UI_COLOR_MODE')}</Text>
            <Row gutter={[12, 12]}>
                {themeOptions.map((option) => (
                    <Col xs={24} sm={8} key={option.value}>
                        <ThemeCard
                            {...option}
                            isSelected={preference === option.value}
                            onClick={() => setTheme(option.value as ThemeOption)}
                        />
                    </Col>
                ))}
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ opacity: 0.5 }}>
                <Text style={{ marginTop: 0, display: 'block' }}>
                    {t('UI_COLOR_SCHEME')}
                    <Tag color="blue" style={{ marginLeft: 8 }}>{t('UI_COMING_SOON')}</Tag>
                </Text>
                <Text type="secondary">{t('UI_COLOR_SCHEME_DESC')}</Text>
            </div>
        </Card>
    );
}
