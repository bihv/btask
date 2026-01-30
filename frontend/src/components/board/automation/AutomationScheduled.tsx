'use client';

import { Typography, Button, theme, Flex } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function AutomationScheduled() {
    const { token } = theme.useToken();

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
                <ClockCircleOutlined style={{ fontSize: 40, color: token.colorPrimary }} />
            </Flex>

            <Title level={3}>Scheduled Automations</Title>
            <Paragraph type="secondary" style={{ maxWidth: 500, marginBottom: 32 }}>
                Set up actions to happen on a schedule, like checking for overdue cards every morning or archiving completed cards every Friday.
            </Paragraph>

            <Button type="primary" size="large" disabled>
                Create Scheduled Automation
            </Button>
            <Text type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
                Coming soon
            </Text>
        </Flex>
    );
}
