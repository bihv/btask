'use client';

import { useState } from 'react';
import { List, Button, Typography, Space, Card, Tag, Flex, App, Modal } from 'antd';
import { DeleteOutlined, RightOutlined, RobotOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useBoardRules, useDeleteRule } from '@/hooks/useAutomation';
import { useBoard, useAllBoards } from '@/hooks/useBoards';
import { theme } from 'antd';
import RuleBuilder from './RuleBuilder';
import { TRIGGER_TEMPLATES, ACTION_TEMPLATES } from './automationTypes';

const { Text, Title, Paragraph } = Typography;

interface AutomationRulesProps {
    boardId: string;
}

export default function AutomationRules({ boardId }: AutomationRulesProps) {
    const { modal } = App.useApp();
    const [isCreating, setIsCreating] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [viewingRule, setViewingRule] = useState<any>(null);
    const { data: rules = [], isLoading } = useBoardRules(boardId);
    const deleteRule = useDeleteRule();
    const { token } = theme.useToken();

    const { data: board } = useBoard(boardId);
    const { data: allBoards } = useAllBoards();

    // Data for resolution
    const lists = board?.lists || [];
    const labels = board?.labels || [];
    const members = (board as any)?.members || [];

    const handleDelete = (id: string) => {
        modal.confirm({
            title: 'Delete Rule?',
            content: 'This action cannot be undone.',
            okType: 'danger',
            onOk: () => deleteRule.mutateAsync(id),
        });
    };

    const renderTriggerDescription = (rule: any) => {
        const config = rule.trigger_config || {};
        // Match by trigger_config.id first, then trigger_type
        const triggerId = config.id || rule.trigger_type;
        const template = TRIGGER_TEMPLATES.find(t => t.id === triggerId);

        if (template) {
            return (
                <Text>
                    {template.parts.map((part, index) => {
                        if (part.type === 'static') return <span key={index}>{part.value} </span>;

                        if (part.key) {
                            let val = config[part.key];

                            if (part.type === 'list_select' && val) {
                                const list = lists.find((l: any) => l.id === val);
                                if (list) val = list.title;
                            }
                            if (part.type === 'board_select' && val) {
                                const b = allBoards?.find((b: any) => b.id === val);
                                if (b) val = b.title;
                            }
                            if (part.type === 'member_select' && val) {
                                const m = members.find((m: any) => m.id === val);
                                if (m) val = m.username || m.fullName;
                            }
                            if (part.type === 'label_select' && val) {
                                if (typeof val === 'object') val = val.name;
                                else {
                                    const l = labels.find((l: any) => l.id === val);
                                    if (l) val = l.name;
                                }
                            }
                            if (part.type === 'user' && val && typeof val === 'object') {
                                val = val.text || val.username || val.name;
                            }
                            if (typeof val === 'object' && val !== null) {
                                return JSON.stringify(val);
                            }

                            // Use default value if config value is missing
                            const displayVal = val !== undefined && val !== null && val !== '' ? val : part.value;
                            if (displayVal === undefined || displayVal === null) return null;

                            return <Text strong key={index}>{displayVal}{' '}</Text>;
                        }
                        return null;
                    })}
                </Text>
            );
        }

        if (rule.trigger_type === 'event') {
            return <Tag color="blue">Event: {config.event}</Tag>;
        }
        return <Tag>{rule.trigger_type}</Tag>;
    };

    const renderActionDescription = (action: any) => {
        // action.type or action.id might be used
        const actionId = action.id || action.type;
        const template = ACTION_TEMPLATES.find(t => t.id === actionId);

        if (!template) return <Text>{actionId}</Text>;

        return (
            <Text>
                {template.parts.map((part, index) => {
                    if (part.type === 'static') return <span key={index}>{part.value} </span>;

                    if (part.key) {
                        let val = action[part.key];

                        if (part.type === 'list_select' && val) {
                            const list = lists.find((l: any) => l.id === val);
                            if (list) val = list.title;
                        }
                        if (part.type === 'board_select' && val) {
                            const b = allBoards?.find((b: any) => b.id === val);
                            if (b) val = b.title;
                        }

                        // Use default value if config value is missing
                        const displayVal = val !== undefined && val !== null && val !== '' ? val : part.value;
                        if (displayVal === undefined || displayVal === null) return null;

                        return <Text strong key={index}>{displayVal}{' '}</Text>;
                    }
                    return null;
                })}
            </Text>
        );
    };

    if (isCreating || editingRule) {
        return (
            <div style={{ padding: '24px' }}>
                <Button onClick={() => { setIsCreating(false); setEditingRule(null); }} style={{ marginBottom: 16 }}>
                    Back to Rules
                </Button>
                <RuleBuilder
                    boardId={boardId}
                    ruleToEdit={editingRule}
                    onCancel={() => { setIsCreating(false); setEditingRule(null); }}
                    onSuccess={() => { setIsCreating(false); setEditingRule(null); }}
                />
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
                                    <Space orientation="vertical" size={2} style={{ flex: 1, cursor: 'pointer' }} onClick={() => setViewingRule(rule)}>
                                        <Text strong style={{ fontSize: 16 }}>{rule.name}</Text>
                                        <Space>
                                            {renderTriggerDescription(rule)}
                                            <RightOutlined style={{ fontSize: 10 }} />
                                            <Tag color="green">{rule.actions?.length || 0} Actions</Tag>
                                        </Space>
                                    </Space>
                                    <Space>
                                        <Button
                                            icon={<EyeOutlined />}
                                            type="text"
                                            onClick={() => setViewingRule(rule)}
                                        />
                                        <Button
                                            icon={<EditOutlined />}
                                            type="text"
                                            onClick={() => setEditingRule(rule)}
                                        />
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            type="text"
                                            onClick={() => handleDelete(rule.id)}
                                        />
                                    </Space>
                                </Flex>
                            </Card>
                        </List.Item>
                    )}
                />
            )}

            <Modal
                title="Rule Summary"
                open={!!viewingRule}
                onCancel={() => setViewingRule(null)}
                footer={[
                    <Button key="close" onClick={() => setViewingRule(null)}>
                        Close
                    </Button>
                ]}
            >
                {viewingRule && (
                    <Flex vertical gap={16}>
                        <div>
                            <Text type="secondary">Rule Name</Text>
                            <Paragraph strong style={{ fontSize: 16, margin: 0 }}>{viewingRule.name}</Paragraph>
                        </div>

                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Trigger</Text>
                            {renderTriggerDescription(viewingRule)}
                        </div>

                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                Actions ({viewingRule.actions?.length || 0})
                            </Text>
                            <List
                                size="small"
                                bordered
                                dataSource={viewingRule.actions}
                                renderItem={(action: any) => (
                                    <List.Item>
                                        {renderActionDescription(action)}
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Flex>
                )}
            </Modal>
        </div>
    );
}
