'use client';

import { Typography, Button, theme, Flex } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Paragraph, Text } = Typography;

export default function AutomationDueDate() {
    const { token } = theme.useToken();
    const t = useTranslation();

    return (
        <Flex vertical align="center" justify="center" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Flex
                align="center"
                justify="center"
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: token.colorFillSecondary,
                    marginBottom: 24
                }}
            >
                <CalendarOutlined style={{ fontSize: 40, color: token.colorPrimary }} />
            </Flex>

            <Title level={3}>{t('UI_DUE_DATE_AUTOMATION')}</Title>
            <Paragraph type="secondary" style={{ maxWidth: 500, marginBottom: 32 }}>
                {t('UI_DUE_DATE_DESCRIPTION')}
            </Paragraph>

            <Button type="primary" size="large" disabled>
                {t('UI_CREATE_DUE_DATE')}
            </Button>
            <Text type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
                {t('UI_COMING_SOON')}
            </Text>
        </Flex>
    );
}
