'use client';

import { useState } from 'react';
import { List, Button, Typography, Space, Card, Tag, Flex, App } from 'antd';
import { DeleteOutlined, RightOutlined, RobotOutlined } from '@ant-design/icons';
import { useBoardRules, useDeleteRule } from '@/hooks/useAutomation';
import { theme } from 'antd';
import RuleBuilder from './RuleBuilder';

const { Text, Title, Paragraph } = Typography;

interface AutomationRulesProps {
    boardId: string;
}

export default function AutomationRules({ boardId }: AutomationRulesProps) {
    const { modal } = App.useApp();
    const [isCreating, setIsCreating] = useState(false);
    const { data: rules = [], isLoading } = useBoardRules(boardId);
    const deleteRule = useDeleteRule();
    const { token } = theme.useToken();

    const handleDelete = (id: string) => {
        modal.confirm({
            title: 'Delete Rule?',
            content: 'This action cannot be undone.',
            okType: 'danger',
            onOk: () => deleteRule.mutateAsync(id),
        });
    };

    const renderTriggerDescription = (rule: any) => {
        const config = rule.trigger_config;
        if (rule.trigger_type === 'event') {
            return <Tag color="blue">Event: {config.event}</Tag>;
        }
        return <Tag>{rule.trigger_type}</Tag>;
    };

    if (isCreating) {
        return (
            <div style={{ padding: '24px' }}>
                <Button onClick={() => setIsCreating(false)} style={{ marginBottom: 16 }}>
                    Back to Rules
                </Button>
                <RuleBuilder boardId={boardId} onCancel={() => setIsCreating(false)} onSuccess={() => setIsCreating(false)} />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header Section */}
            <Flex vertical gap={32} style={{ marginBottom: 32 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Title level={3} style={{ margin: 0 }}>Rules</Title>
                    <Button type="primary" onClick={() => setIsCreating(true)}>
                        Create automation
                    </Button>
                </Flex>

                {(!rules.length && !isLoading) && (
                    <Flex gap={24} align="start">
                        <div style={{ flex: 1 }}>
                            <Title level={5} style={{ marginTop: 0 }}>
                                Rules are simple: when one thing happens, another thing happens automatically
                            </Title>
                            <Paragraph type="secondary">Examples:</Paragraph>
                            <ul style={{ color: token.colorTextSecondary, paddingLeft: 20 }}>
                                <li style={{ marginBottom: 8 }}>
                                    When a <strong>card is created</strong> in list "To Do" by me, <strong>add the "Steps" checklist</strong>.
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    When a <strong>card is moved</strong> to list "Done" by anyone, <strong>mark the due date as complete</strong>.
                                </li>
                                <li>
                                    When I am <strong>added to a card</strong>, <strong>set the due date</strong> in 5 days.
                                </li>
                            </ul>
                        </div>
                        {/* Video Placeholder */}
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 280,
                                height: 160,
                                background: token.colorFillSecondary,
                                borderRadius: token.borderRadius,
                                color: token.colorText,
                                flexShrink: 0
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <RobotOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                                <div>How to create rules</div>
                            </div>
                        </Flex>
                    </Flex>
                )}
            </Flex>

            {(rules.length > 0 || isLoading) && (
                <List
                    header={<Text strong>Your Rules</Text>}
                    loading={isLoading}
                    dataSource={rules}
                    renderItem={(rule: any) => (
                        <List.Item>
                            <Card style={{ width: '100%' }} size="small" hoverable>
                                <Flex justify="space-between" align="center">
                                    <Space orientation="vertical" size={2}>
                                        <Text strong style={{ fontSize: 16 }}>{rule.name}</Text>
                                        <Space>
                                            {renderTriggerDescription(rule)}
                                            <RightOutlined style={{ fontSize: 10 }} />
                                            <Tag color="green">{rule.actions?.length || 0} Actions</Tag>
                                        </Space>
                                    </Space>
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        type="text"
                                        onClick={() => handleDelete(rule.id)}
                                    />
                                </Flex>
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
}
