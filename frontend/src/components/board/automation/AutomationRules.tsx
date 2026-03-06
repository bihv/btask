'use client';

import {
    findActionById,
    findTriggerById,
    useAvailableActions,
    useAvailableTriggers,
    useBoardRules,
    useDeleteRule,
    useToggleRule,
} from '@/hooks/useAutomationSchema';
import { useAllBoards, useBoard } from '@/hooks/useBoards';
import { useTranslation } from '@/hooks/useLabels';
import type { AutomationRule, RuleCondition } from '@/types/automation';
import { Badge, Button, Card, Flex, Group, Loader, Modal, Stack, Switch, Text, Title, Tooltip } from '@mantine/core';
import { IconBolt, IconChevronRight, IconEdit, IconEye, IconFilter, IconRobot, IconTrash } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import RuleBuilder from './RuleBuilder';
import { SentenceDisplay } from './SentenceTemplateRenderer';

interface AutomationRulesProps {
    boardId: string;
}

export default function AutomationRules({ boardId }: AutomationRulesProps) {
    const t = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [viewingRule, setViewingRule] = useState<AutomationRule | null>(null);
    const { data: rules = [], isLoading } = useBoardRules(boardId);
    const deleteRule = useDeleteRule();
    const toggleRule = useToggleRule();
    // Use Mantine theme vars via CSS variables

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
        /* TODO: implement confirmation dialog */ ({
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

        return <Badge color="blue">{triggerSchema?.name || triggerId}</Badge>;
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
            <Tooltip label={`${conditions.length} ${t('UI_CONDITION_MUST_BE_MET')}`}>
                <Badge color="orange" leftSection={<IconFilter size={16} />}>
                    {conditions.length} condition{conditions.length > 1 ? 's' : ''}
                </Badge>
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
            <Flex direction="column" gap={32} style={{ marginBottom: 32 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Title order={3} style={{ margin: 0 }}>{t('UI_RULES')}</Title>
                    <Button onClick={() => setIsCreating(true)}>
                        {t('UI_CREATE_AUTOMATION')}
                    </Button>
                </Flex>

                {(!rules.length && !isLoading) && (
                    <Flex gap={24} align="start">
                        <div style={{ flex: 1 }}>
                            <Title order={5} style={{ marginTop: 0 }}>
                                {t('UI_RULES_EXPLANATION')}
                            </Title>
                            <Text c="dimmed">{t('UI_EXAMPLES')}</Text>
                            <ul style={{ color: 'var(--mantine-color-dimmed)', paddingLeft: 20 }}>
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
                                background: 'var(--mantine-color-gray-1)',
                                borderRadius: 'var(--mantine-radius-default)',
                                color: 'var(--mantine-color-text)',
                                flexShrink: 0
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <IconRobot size={32} />
                                <div>{t('UI_HOW_TO_CREATE_RULES')}</div>
                            </div>
                        </Flex>
                    </Flex>
                )}
            </Flex>

            {(rules.length > 0 || isLoading || schemaLoading) && (
                <div>
                    <Text fw={700} mb={8}>{t('UI_YOUR_RULES')}</Text>
                    {(isLoading || schemaLoading) && <Loader size="sm" />}
                    <Stack gap={8}>
                        {rules.map((rule: AutomationRule) => (
                            <Card key={rule.id} style={{ width: '100%' }} withBorder>
                                <Flex justify="space-between" align="center">
                                    <Group style={{ flex: 1, cursor: 'pointer' }} onClick={() => setViewingRule(rule)}>
                                        <div>
                                            <Group align="center" style={{ marginBottom: 4 }}>
                                                <Text fw={700} style={{ fontSize: 16 }}>{rule.name}</Text>
                                                {!rule.is_enabled && <Badge color="gray">{t('UI_DISABLED')}</Badge>}
                                            </Group>
                                            <div>
                                                <Group gap={4}>
                                                    <IconBolt size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                                    {renderTriggerDescription(rule)}
                                                    {renderConditionsSummary(rule.conditions)}
                                                    <IconChevronRight size={10} />
                                                    <Badge color="green">{rule.actions?.length || 0} {t('UI_ACTION')}{(rule.actions?.length || 0) !== 1 ? 's' : ''}</Badge>
                                                </Group>
                                            </div>
                                            {rule.run_count !== undefined && rule.run_count > 0 && (
                                                <Text c="dimmed" style={{ fontSize: 12 }}>
                                                    {t('UI_RAN')} {rule.run_count} {t('UI_TIMES')}
                                                    {rule.last_run_at && ` · Last: ${new Date(rule.last_run_at).toLocaleDateString()}`}
                                                </Text>
                                            )}
                                        </div>
                                    </Group>
                                    <Group>
                                        <Tooltip label={rule.is_enabled ? t('UI_DISABLE') : t('UI_ENABLE')}>
                                            <Switch
                                                size="sm"
                                                checked={rule.is_enabled}
                                                onChange={() => handleToggle(rule)}
                                                disabled={toggleRule.isPending}
                                            />
                                        </Tooltip>
                                        <Button
                                            leftSection={<IconEye size={16} />}
                                            variant="subtle"
                                            onClick={() => setViewingRule(rule)}
                                        />
                                        <Button
                                            leftSection={<IconEdit size={16} />}
                                            variant="subtle"
                                            onClick={() => setEditingRule(rule)}
                                        />
                                        <Button
                                            color="red"
                                            leftSection={<IconTrash size={16} />}
                                            variant="subtle"
                                            onClick={() => handleDelete(rule.id)}
                                        />
                                    </Group>
                                </Flex>
                            </Card>
                        ))}
                    </Stack>
                </div>
            )}

            <Modal
                title={t('UI_RULE_SUMMARY')}
                opened={!!viewingRule}
                onClose={() => setViewingRule(null)}
            >
                {viewingRule && (
                    <Flex direction="column" gap={16}>
                        <div>
                            <Text c="dimmed">{t('UI_RULE_NAME')}</Text>
                            <Text fw={700} style={{ fontSize: 16, margin: 0 }}>{viewingRule.name}</Text>
                        </div>

                        <div>
                            <Text c="dimmed">{t('UI_STATUS')}</Text>
                            <div>
                                <Badge color={viewingRule.is_enabled ? 'green' : 'default'}>
                                    {viewingRule.is_enabled ? t('UI_ENABLED') : t('UI_DISABLED')}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>{t('UI_TRIGGER')}</Text>
                            <Card >
                                <Group>
                                    <IconBolt size={16} />
                                    {renderTriggerDescription(viewingRule)}
                                </Group>
                            </Card>
                        </div>

                        {viewingRule.conditions && viewingRule.conditions.length > 0 && (
                            <div>
                                <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>
                                    {t('UI_CONDITIONS')} ({viewingRule.conditions.length})
                                </Text>
                                <Card>
                                    <Stack gap={4}>
                                        {viewingRule.conditions.map((cond: RuleCondition, idx: number) => (
                                            <div key={idx} style={{ padding: '4px 0' }}>
                                                <Group>
                                                    {idx > 0 && <Badge color="blue">{cond.logic?.toUpperCase() || 'AND'}</Badge>}
                                                    <Text ff="monospace">{cond.field}</Text>
                                                    <Text c="dimmed">{cond.operator}</Text>
                                                    {cond.value !== undefined && <Text fw={700}>{JSON.stringify(cond.value)}</Text>}
                                                </Group>
                                            </div>
                                        ))}
                                    </Stack>
                                </Card>
                            </div>
                        )}

                        <div>
                            <Text c="dimmed" style={{ display: 'block', marginBottom: 8 }}>
                                {t('UI_ACTIONS')} ({viewingRule.actions?.length || 0})
                            </Text>
                            <Stack gap={4}>
                                {viewingRule.actions?.map((action: any, idx: number) => (
                                    <div key={idx}>
                                        <Group>
                                            <Badge color="green">{idx + 1}</Badge>
                                            {renderActionDescription(action)}
                                        </Group>
                                    </div>
                                ))}
                            </Stack>
                        </div>

                        {(viewingRule.run_count !== undefined || viewingRule.last_run_at) && (
                            <div>
                                <Text c="dimmed">{t('UI_STATISTICS')}</Text>
                                <div>
                                    <Text>
                                        {t('UI_RAN')} {viewingRule.run_count || 0} {t('UI_TIMES')}
                                    </Text>
                                    {viewingRule.last_run_at && (
                                        <Text c="dimmed"> · {t('UI_LAST_RUN')} {new Date(viewingRule.last_run_at).toLocaleString()}</Text>
                                    )}
                                </div>
                            </div>
                        )}
                    </Flex>
                )}
            </Modal>
        </div >
    );
}
