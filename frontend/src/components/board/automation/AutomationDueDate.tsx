'use client';

import { Typography, Button, theme, Flex } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function AutomationDueDate() {
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
                <CalendarOutlined style={{ fontSize: 40, color: token.colorPrimary }} />
            </Flex>

            <Title level={3}>Due Date Automation</Title>
            <Paragraph type="secondary" style={{ maxWidth: 500, marginBottom: 32 }}>
                Automatically sort lists by due date, or trigger actions when a due date is approaching or overdue.
            </Paragraph>

            <Button type="primary" size="large" disabled>
                Create Due Date Automation
            </Button>
            <Text type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
                Coming soon
            </Text>
        </Flex>
    );
}
