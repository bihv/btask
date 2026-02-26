'use client';

import { useState, useMemo, useCallback } from 'react';
import { List, Button, Typography, Space, Card, Tag, Flex, App, Modal, Switch, Tooltip, Spin } from 'antd';
import { DeleteOutlined, RightOutlined, RobotOutlined, EditOutlined, EyeOutlined, FilterOutlined, PlayCircleOutlined, PauseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import {
    useBoardRules,
    useDeleteRule,
    useToggleRule,
    useAvailableTriggers,
    useAvailableActions,
    findTriggerById,
    findActionById,
} from '@/hooks/useAutomationSchema';
import { SentenceDisplay } from './SentenceTemplateRenderer';
import { useBoard, useAllBoards } from '@/hooks/useBoards';
import { theme } from 'antd';
import RuleBuilder from './RuleBuilder';
import type { AutomationRule, RuleCondition } from '@/types/automation';
import { useTranslation } from '@/hooks/useLabels';

const { Text, Title, Paragraph } = Typography;

interface AutomationRulesProps {
    boardId: string;
}

export default function AutomationRules({ boardId }: AutomationRulesProps) {
    const { modal } = App.useApp();
    const t = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [viewingRule, setViewingRule] = useState<AutomationRule | null>(null);
    const { data: rules = [], isLoading } = useBoardRules(boardId);
    const deleteRule = useDeleteRule();
    const toggleRule = useToggleRule();
    const { token } = theme.useToken();

    // Load schema for dynamic descriptions
    const { data: triggers = [], isLoading: loadingTriggers } = useAvailableTriggers();
    const { data: actions = [], isLoading: loadingActions } = useAvailableActions();

    const { data: board } = useBoard(boardId);
    const { data: allBoards } = useAllBoards();

    // Context for SentenceDisplay
    const context = useMemo(() => ({
        lists: (board?.lists || []).map(l => ({ id: l.id, title: l.title })),
        labels: (board?.labels || []).map(l => ({ id: l.id, name: l.name || '', color: l.color })),
        members: ((board as any)?.members || []).map((m: any) => ({
            id: m.id,
            username: m.username,
            full_name: m.full_name
        })),
        boards: (allBoards || []).map(b => ({ id: b.id, title: b.title })),
    }), [board, allBoards]);

    const handleDelete = (id: string) => {
        modal.confirm({
            title: t('UI_DELETE_RULE'),
            content: t('UI_CANNOT_UNDO'),
            okType: 'danger',
            onOk: () => deleteRule.mutateAsync(id),
        });
    };

    const handleToggle = (rule: AutomationRule) => {
        toggleRule.mutate({ id: rule.id, enabled: !rule.is_enabled });
    };

    // Render trigger description using schema
    const renderTriggerDescription = useCallback((rule: AutomationRule) => {
        const config = rule.trigger_config || {};
        const triggerId = config.id || rule.trigger_type;

        const triggerSchema = findTriggerById(triggers, triggerId);
        if (triggerSchema && triggerSchema.sentence_template) {
            return (
                <SentenceDisplay
                    template={triggerSchema.sentence_template}
                    config={config}
                    properties={triggerSchema.properties.reduce((acc, p) => {
                        acc[p.name] = p;
                        return acc;
                    }, {} as Record<string, any>)}
                    context={context}
                />
            );
        }

        return <Tag color="blue">{triggerSchema?.name || triggerId}</Tag>;
    }, [triggers, context]);

    // Render action description
    const renderActionDescription = useCallback((action: any) => {
        const actionId = action.id || action.type;

        const actionSchema = findActionById(actions, actionId);
        if (actionSchema && actionSchema.sentence_template) {
            return (
                <SentenceDisplay
                    template={actionSchema.sentence_template}
                    config={action}
                    properties={actionSchema.properties.reduce((acc, p) => {
                        acc[p.name] = p;
                        return acc;
                    }, {} as Record<string, any>)}
                    context={context}
                />
            );
        }

        return <Text>{actionSchema?.name || actionId}</Text>;
    }, [actions, context]);

    // Render conditions summary
    const renderConditionsSummary = (conditions?: RuleCondition[]) => {
        if (!conditions || conditions.length === 0) return null;
        return (
            <Tooltip title={`${conditions.length} ${t('UI_CONDITION_MUST_BE_MET')}`}>
                <Tag color="orange" icon={<FilterOutlined />}>
                    {conditions.length} condition{conditions.length > 1 ? 's' : ''}
                </Tag>
            </Tooltip>
        );
    };

    if (isCreating || editingRule) {
        return (
            <div style={{ padding: '24px' }}>
                <Button onClick={() => { setIsCreating(false); setEditingRule(null); }} style={{ marginBottom: 16 }}>
                    {t('UI_BACK_TO_RULES')}
                </Button>
                <RuleBuilder
                    boardId={boardId}
                    ruleToEdit={editingRule || undefined}
                    onCancel={() => { setIsCreating(false); setEditingRule(null); }}
                    onSuccess={() => { setIsCreating(false); setEditingRule(null); }}
                />
            </div>
        );
    }

    // Show loading if schema is loading
    const schemaLoading = loadingTriggers || loadingActions;

    return (
        <div style={{ padding: '24px' }}>
            {/* Header Section */}
            <Flex vertical gap={32} style={{ marginBottom: 32 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Title level={3} style={{ margin: 0 }}>{t('UI_RULES')}</Title>
                    <Button type="primary" onClick={() => setIsCreating(true)}>
                        {t('UI_CREATE_AUTOMATION')}
                    </Button>
                </Flex>

                {(!rules.length && !isLoading) && (
                    <Flex gap={24} align="start">
                        <div style={{ flex: 1 }}>
                            <Title level={5} style={{ marginTop: 0 }}>
                                {t('UI_RULES_EXPLANATION')}
                            </Title>
                            <Paragraph type="secondary">{t('UI_EXAMPLES')}</Paragraph>
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
                                <div>{t('UI_HOW_TO_CREATE_RULES')}</div>
                            </div>
                        </Flex>
                    </Flex>
                )}
            </Flex>

            {(rules.length > 0 || isLoading || schemaLoading) && (
                <List
                    header={<Text strong>{t('UI_YOUR_RULES')}</Text>}
                    loading={isLoading || schemaLoading}
                    dataSource={rules}
                    renderItem={(rule: AutomationRule) => (
                        <List.Item>
                            <Card style={{ width: '100%' }} size="small" hoverable>
                                <Flex justify="space-between" align="center">
                                    <Space style={{ flex: 1, cursor: 'pointer' }} onClick={() => setViewingRule(rule)}>
                                        <div>
                                            <Space align="center" style={{ marginBottom: 4 }}>
                                                <Text strong style={{ fontSize: 16 }}>{rule.name}</Text>
                                                {!rule.is_enabled && <Tag color="default">{t('UI_DISABLED')}</Tag>}
                                            </Space>
                                            <div>
                                                <Space size={4}>
                                                    <ThunderboltOutlined style={{ color: token.colorTextSecondary }} />
                                                    {renderTriggerDescription(rule)}
                                                    {renderConditionsSummary(rule.conditions)}
                                                    <RightOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                                                    <Tag color="green">{rule.actions?.length || 0} {t('UI_ACTION')}{(rule.actions?.length || 0) !== 1 ? 's' : ''}</Tag>
                                                </Space>
                                            </div>
                                            {rule.run_count !== undefined && rule.run_count > 0 && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {t('UI_RAN')} {rule.run_count} {t('UI_TIMES')}
                                                    {rule.last_run_at && ` · Last: ${new Date(rule.last_run_at).toLocaleDateString()}`}
                                                </Text>
                                            )}
                                        </div>
                                    </Space>
                                    <Space>
                                        <Tooltip title={rule.is_enabled ? t('UI_DISABLE') : t('UI_ENABLE')}>
                                            <Switch
                                                size="small"
                                                checked={rule.is_enabled}
                                                onChange={() => handleToggle(rule)}
                                                loading={toggleRule.isPending}
                                            />
                                        </Tooltip>
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
                title={t('UI_RULE_SUMMARY')}
                open={!!viewingRule}
                onCancel={() => setViewingRule(null)}
                footer={[
                    <Button key="close" onClick={() => setViewingRule(null)}>
                        {t('UI_CLOSE')}
                    </Button>,
                    <Button key="edit" type="primary" onClick={() => { setEditingRule(viewingRule); setViewingRule(null); }}>
                        {t('UI_EDIT_RULE')}
                    </Button>
                ]}
            >
                {viewingRule && (
                    <Flex vertical gap={16}>
                        <div>
                            <Text type="secondary">{t('UI_RULE_NAME')}</Text>
                            <Paragraph strong style={{ fontSize: 16, margin: 0 }}>{viewingRule.name}</Paragraph>
                        </div>

                        <div>
                            <Text type="secondary">{t('UI_STATUS')}</Text>
                            <div>
                                <Tag color={viewingRule.is_enabled ? 'green' : 'default'}>
                                    {viewingRule.is_enabled ? t('UI_ENABLED') : t('UI_DISABLED')}
                                </Tag>
                            </div>
                        </div>

                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t('UI_TRIGGER')}</Text>
                            <Card size="small">
                                <Space>
                                    <ThunderboltOutlined />
                                    {renderTriggerDescription(viewingRule)}
                                </Space>
                            </Card>
                        </div>

                        {viewingRule.conditions && viewingRule.conditions.length > 0 && (
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                    {t('UI_CONDITIONS')} ({viewingRule.conditions.length})
                                </Text>
                                <Card size="small">
                                    <List
                                        size="small"
                                        dataSource={viewingRule.conditions}
                                        renderItem={(cond: RuleCondition, idx: number) => (
                                            <List.Item style={{ padding: '4px 0' }}>
                                                <Space>
                                                    {idx > 0 && <Tag color="blue">{cond.logic?.toUpperCase() || 'AND'}</Tag>}
                                                    <Text code>{cond.field}</Text>
                                                    <Text type="secondary">{cond.operator}</Text>
                                                    {cond.value !== undefined && <Text strong>{JSON.stringify(cond.value)}</Text>}
                                                </Space>
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </div>
                        )}

                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                {t('UI_ACTIONS')} ({viewingRule.actions?.length || 0})
                            </Text>
                            <List
                                size="small"
                                bordered
                                dataSource={viewingRule.actions}
                                renderItem={(action: any, idx: number) => (
                                    <List.Item>
                                        <Space>
                                            <Tag color="green">{idx + 1}</Tag>
                                            {renderActionDescription(action)}
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </div>

                        {(viewingRule.run_count !== undefined || viewingRule.last_run_at) && (
                            <div>
                                <Text type="secondary">{t('UI_STATISTICS')}</Text>
                                <div>
                                    <Text>
                                        {t('UI_RAN')} {viewingRule.run_count || 0} {t('UI_TIMES')}
                                    </Text>
                                    {viewingRule.last_run_at && (
                                        <Text type="secondary"> · {t('UI_LAST_RUN')} {new Date(viewingRule.last_run_at).toLocaleString()}</Text>
                                    )}
                                </div>
                            </div>
                        )}
                    </Flex>
                )}
            </Modal>
        </div>
    );
}
