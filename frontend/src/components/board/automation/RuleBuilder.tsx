'use client';

import {
    useActionsByCategory,
    useCreateRule,
    useTriggersByCategory,
    useUpdateRule,
} from '@/hooks/useAutomationSchema';
import { useAllBoards, useBoard } from '@/hooks/useBoards';
import { useTranslation } from '@/hooks/useLabels';
import type { ActionSchema, AutomationRule, PropertySchema, TriggerSchema } from '@/types/automation';
import { ACTION_CATEGORY_INFO, TRIGGER_CATEGORY_INFO } from '@/types/automation';
import { Alert, Button, Card, Divider, Flex, Group, Loader, Stack, Stepper, Switch, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconCheck, IconDeviceFloppy, IconPlayerPlay, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import SentenceTemplateRenderer, { SentenceDisplay } from './SentenceTemplateRenderer';

// ============================================================================
// Types
// ============================================================================

interface RuleBuilderProps {
    boardId: string;
    onCancel: () => void;
    onSuccess: () => void;
    ruleToEdit?: AutomationRule;
}

interface ActionConfig {
    id: string;
    [key: string]: any;
}

/** Context type for SentenceTemplateRenderer */
interface PickerContext {
    lists?: Array<{ id: string; title: string }>;
    labels?: Array<{ id: string; name: string; color?: string }>;
    members?: Array<{ id: string; username?: string; full_name?: string }>;
    boards?: Array<{ id: string; title: string }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Convert PropertySchema[] to Record<string, PropertySchema> */
function propertiesToRecord(properties: PropertySchema[]): Record<string, PropertySchema> {
    return properties.reduce((acc, prop) => {
        acc[prop.name] = prop;
        return acc;
    }, {} as Record<string, PropertySchema>);
}

// ============================================================================
// Main Component
// ============================================================================

export default function RuleBuilder({ boardId, onCancel, onSuccess, ruleToEdit }: RuleBuilderProps) {
    const t = useTranslation();

    // API hooks
    const { data: triggersByCategory, triggers: allTriggers = [], isLoading: loadingTriggers } = useTriggersByCategory();
    const { data: actionsByCategory, actions: allActions = [], isLoading: loadingActions } = useActionsByCategory();
    const { data: board } = useBoard(boardId);
    const { data: allBoards } = useAllBoards();
    const createRule = useCreateRule();
    const updateRule = useUpdateRule();

    // Board context for pickers - transform to match PickerContext
    const context: PickerContext = useMemo(() => ({
        lists: (board?.lists || []).map(l => ({ id: l.id, title: l.title })),
        labels: (board?.labels || []).map(l => ({ id: l.id, name: l.name || '', color: l.color })),
        members: ((board as any)?.members || []).map((m: any) => ({
            id: m.id,
            username: m.username,
            full_name: m.full_name
        })),
        boards: (allBoards || []).map(b => ({ id: b.id, title: b.title })),
    }), [board, allBoards]);

    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const [activeCategory, setActiveCategory] = useState<string>('card');
    const [activeActionCategory, setActiveActionCategory] = useState<string>('card');

    // Rule state
    const [selectedTrigger, setSelectedTrigger] = useState<TriggerSchema | null>(null);
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
    const [actions, setActions] = useState<ActionConfig[]>([]);
    const [actionConfigs, setActionConfigs] = useState<Record<string, Record<string, any>>>({});
    const [ruleName, setRuleName] = useState('New Automation Rule');
    const [isEnabled, setIsEnabled] = useState(true);

    // Initialize from ruleToEdit
    useEffect(() => {
        if (ruleToEdit && allTriggers.length > 0) {
            setRuleName(ruleToEdit.name);
            setIsEnabled(ruleToEdit.is_enabled);

            // Find trigger by matching the trigger_config.id
            const triggerId = ruleToEdit.trigger_config?.id;
            const trigger = allTriggers.find(t => t.id === triggerId);
            if (trigger) {
                setSelectedTrigger(trigger);
                setTriggerConfig(ruleToEdit.trigger_config || {});
            }

            // Set actions
            if (ruleToEdit.actions) {
                setActions(ruleToEdit.actions);
                const configs: Record<string, Record<string, any>> = {};
                ruleToEdit.actions.forEach((action: any) => {
                    configs[action.id] = action;
                });
                setActionConfigs(configs);
            }
        }
    }, [ruleToEdit, allTriggers]);

    // Get categories with triggers/actions
    const triggerCategories = useMemo(() => {
        return TRIGGER_CATEGORY_INFO.filter(cat =>
            triggersByCategory[cat.id] && triggersByCategory[cat.id].length > 0
        );
    }, [triggersByCategory]);

    const actionCategories = useMemo(() => {
        return ACTION_CATEGORY_INFO.filter(cat =>
            actionsByCategory[cat.id] && actionsByCategory[cat.id].length > 0
        );
    }, [actionsByCategory]);

    // Set initial category
    useEffect(() => {
        if (triggerCategories.length > 0 && !triggersByCategory[activeCategory]) {
            setActiveCategory(triggerCategories[0].id);
        }
    }, [triggerCategories, activeCategory, triggersByCategory]);

    useEffect(() => {
        if (actionCategories.length > 0 && !actionsByCategory[activeActionCategory]) {
            setActiveActionCategory(actionCategories[0].id);
        }
    }, [actionCategories, activeActionCategory, actionsByCategory]);

    // Handlers
    const handleSelectTrigger = (trigger: TriggerSchema) => {
        setSelectedTrigger(trigger);
        // Initialize with default values
        const defaults: Record<string, any> = { id: trigger.id };
        trigger.properties.forEach(prop => {
            if (prop.default !== undefined) {
                defaults[prop.name] = prop.default;
            }
        });
        setTriggerConfig(defaults);
    };

    const handleUpdateTriggerProp = (key: string, value: any) => {
        setTriggerConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleAddAction = (actionSchema: ActionSchema) => {
        const config: ActionConfig = { id: actionSchema.id };
        actionSchema.properties.forEach(prop => {
            if (prop.default !== undefined) {
                config[prop.name] = prop.default;
            }
        });
        setActions(prev => [...prev, config]);
        setActionConfigs(prev => ({
            ...prev,
            [actionSchema.id]: config,
        }));
    };

    const handleUpdateActionProp = (actionId: string, key: string, value: any) => {
        setActionConfigs(prev => ({
            ...prev,
            [actionId]: { ...prev[actionId], [key]: value },
        }));
        setActions(prev => prev.map(a =>
            a.id === actionId ? { ...a, [key]: value } : a
        ));
    };

    const handleRemoveAction = (index: number) => {
        setActions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!selectedTrigger || actions.length === 0) {
            notifications.show({ title: 'Error', message: t('ERROR_SELECT_TRIGGER_AND_ACTION'), color: 'red' });
            return;
        }

        // Validate required fields in actions
        for (const action of actions) {
            const schema = allActions.find(s => s.id === action.id);
            if (schema) {
                for (const prop of schema.properties) {
                    if (prop.required && (action[prop.name] === undefined || action[prop.name] === null || action[prop.name] === '')) {
                        notifications.show({ title: 'Error', message: `Please fill in "${prop.label || prop.name}" for action "${schema.name}"`, color: 'red' });
                        return;
                    }
                }
            }
        }

        const ruleData = {
            name: ruleName,
            description: `When ${selectedTrigger.name}, ${actions.map(a => {
                const schema = allActions.find(s => s.id === a.id);
                return schema?.name || a.id;
            }).join(' and ')}`,
            board_id: boardId,
            trigger_type: 'event' as const,
            trigger_config: { ...triggerConfig, id: selectedTrigger.id },
            actions: actions.map(a => ({ ...a })),
            is_enabled: isEnabled,
        };

        try {
            if (ruleToEdit) {
                await updateRule.mutateAsync({ id: ruleToEdit.id, data: ruleData });
                notifications.show({ message: t('SUCCESS_RULE_UPDATED'), color: 'green' });
            } else {
                await createRule.mutateAsync(ruleData);
                notifications.show({ message: t('SUCCESS_RULE_CREATED'), color: 'green' });
            }
            onSuccess();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message || t('ERROR_SAVE_RULE_FAILED'), color: 'red' });
        }
    };

    // Loading state
    if (loadingTriggers || loadingActions) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Loader size="lg" />
                <div style={{ marginTop: 16 }}>{t('UI_LOADING_AUTOMATION_SCHEMA')}</div>
            </div>
        );
    }

    // Empty state
    if (allTriggers.length === 0 && allActions.length === 0) {
        return (
            <Alert
                color="yellow"
                title={t('UI_NO_AUTOMATION_AVAILABLE')}
                style={{ margin: 40 }}
            >
                {t('UI_AUTOMATION_NOT_INITIALIZED')}
            </Alert>
        );
    }

    // Current triggers/actions for active category
    const currentTriggers = triggersByCategory[activeCategory] || [];
    const currentActions = actionsByCategory[activeActionCategory] || [];

    // Render trigger selection step
    const renderTriggerStep = () => (
        <Flex gap={24}>
            {/* Category sidebar */}
            <div style={{ width: 160 }}>
                <Stack gap={4} style={{ width: '100%' }}>
                    {triggerCategories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.id ? 'filled' : 'default'}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                if (selectedTrigger && selectedTrigger.category !== cat.id) {
                                    setSelectedTrigger(null);
                                    setTriggerConfig({});
                                }
                            }}
                            fullWidth
                        >
                            {cat.label}
                        </Button>
                    ))}
                </Stack>
            </div>

            {/* Trigger list */}
            <div style={{ flex: 1 }}>
                {currentTriggers.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">{t('UI_NO_TRIGGERS_IN_CATEGORY')}</Text>
                ) : (
                    <Stack gap={4}>
                        {currentTriggers.map((trigger: TriggerSchema) => (
                            <div
                                key={trigger.id}
                                onClick={() => handleSelectTrigger(trigger)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: selectedTrigger?.id === trigger.id
                                        ? 'var(--mantine-primary-color-light)'
                                        : 'transparent',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    border: selectedTrigger?.id === trigger.id
                                        ? '1px solid var(--mantine-primary-color-filled)'
                                        : '1px solid transparent',
                                }}
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600}>{trigger.name}</Text>
                                        <Text c="dimmed" size="sm">{trigger.description}</Text>
                                    </div>
                                    {selectedTrigger?.id === trigger.id && (
                                        <IconCheck size={16} style={{ color: 'var(--mantine-primary-color-filled)' }} />
                                    )}
                                </Group>
                            </div>
                        ))}
                    </Stack>
                )}

                {/* Trigger configuration */}
                {selectedTrigger && selectedTrigger.sentence_template && (
                    <Card withBorder style={{ marginTop: 16 }}>
                        <Text fw={700} mb={8}>{t('UI_CONFIGURE_TRIGGER')}</Text>
                        <SentenceTemplateRenderer
                            template={selectedTrigger.sentence_template}
                            properties={propertiesToRecord(selectedTrigger.properties)}
                            config={triggerConfig}
                            onChange={handleUpdateTriggerProp}
                            context={context}
                        />
                    </Card>
                )}
            </div>
        </Flex>
    );

    // Render action selection step
    const renderActionStep = () => (
        <Flex gap={24}>
            {/* Category sidebar */}
            <div style={{ width: 160 }}>
                <Stack gap={4} style={{ width: '100%' }}>
                    {actionCategories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={activeActionCategory === cat.id ? 'filled' : 'default'}
                            onClick={() => setActiveActionCategory(cat.id)}
                            fullWidth
                        >
                            {cat.label}
                        </Button>
                    ))}
                </Stack>
            </div>

            {/* Action list and selected actions */}
            <div style={{ flex: 1 }}>
                {/* Available actions */}
                <Title order={5}>{t('UI_AVAILABLE_ACTIONS')}</Title>
                {currentActions.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">{t('UI_NO_ACTIONS_IN_CATEGORY')}</Text>
                ) : (
                    <Stack gap={4}>
                        {currentActions.map((action: ActionSchema) => (
                            <div key={action.id} style={{ padding: '8px 12px' }}>
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600}>{action.name}</Text>
                                        <Text c="dimmed" size="sm">{action.description}</Text>
                                    </div>
                                    <Button
                                        variant="subtle"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => handleAddAction(action)}
                                    >
                                        {t('UI_ADD')}
                                    </Button>
                                </Group>
                            </div>
                        ))}
                    </Stack>
                )}

                <Divider my="md" />

                {/* Selected actions */}
                <Title order={5}>
                    {t('UI_ADDED_ACTIONS')} ({actions.length})
                </Title>
                {actions.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">{t('UI_NO_ACTIONS_ADDED')}</Text>
                ) : (
                    <Stack gap={8}>
                        {actions.map((action, index) => {
                            const schema = allActions.find(a => a.id === action.id);
                            if (!schema) return null;

                            return (
                                <Card key={`${action.id}-${index}`} withBorder>
                                    <Group justify="space-between" mb={8}>
                                        <Text fw={700}>{schema.name}</Text>
                                        <Button
                                            variant="subtle"
                                            color="red"
                                            leftSection={<IconTrash size={16} />}
                                            onClick={() => handleRemoveAction(index)}
                                        />
                                    </Group>
                                    {schema.sentence_template ? (
                                        <SentenceTemplateRenderer
                                            template={schema.sentence_template}
                                            properties={propertiesToRecord(schema.properties)}
                                            config={actionConfigs[action.id] || action}
                                            onChange={(key, value) => handleUpdateActionProp(action.id, key, value)}
                                            context={context}
                                        />
                                    ) : (
                                        <Text c="dimmed">{t('UI_NO_CONFIG_NEEDED')}</Text>
                                    )}
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </div>
        </Flex>
    );

    // Render review step
    const renderReviewStep = () => (
        <Stack gap="lg" style={{ width: '100%' }}>
            <div>
                <TextInput
                    label={t('UI_RULE_NAME')}
                    value={ruleName}
                    onChange={e => setRuleName(e.target.value)}
                    placeholder={t('UI_PLACEHOLDER_RULE_NAME')}
                />
            </div>
            <div>
                <Switch
                    label={t('UI_ENABLED')}
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.currentTarget.checked)}
                />
            </div>

            <Card withBorder>
                <Text fw={700} mb={8}>{t('UI_SUMMARY')}</Text>
                <Stack gap={8}>
                    <div>
                        <Text fw={700}>{t('UI_WHEN')} </Text>
                        {selectedTrigger && selectedTrigger.sentence_template ? (
                            <SentenceDisplay
                                template={selectedTrigger.sentence_template}
                                config={triggerConfig}
                                properties={propertiesToRecord(selectedTrigger.properties)}
                                context={context}
                            />
                        ) : (
                            <Text>{selectedTrigger?.name}</Text>
                        )}
                    </div>

                    <div>
                        <Text fw={700}>{t('UI_THEN')} </Text>
                        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                            {actions.map((action, index) => {
                                const schema = allActions.find(a => a.id === action.id);
                                if (!schema) return null;

                                return (
                                    <li key={index}>
                                        {schema.sentence_template ? (
                                            <SentenceDisplay
                                                template={schema.sentence_template}
                                                config={actionConfigs[action.id] || action}
                                                properties={propertiesToRecord(schema.properties)}
                                                context={context}
                                            />
                                        ) : (
                                            schema.name
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </Stack>
            </Card>
        </Stack>
    );

    return (
        <div style={{ padding: 16 }}>
            <Stepper
                active={currentStep}
                style={{ marginBottom: 24 }}
            >
                <Stepper.Step label={t('UI_TRIGGER')} icon={<IconBolt size={16} />} />
                <Stepper.Step label={t('UI_ACTIONS')} icon={<IconPlayerPlay size={16} />} />
                <Stepper.Step label={t('UI_REVIEW')} icon={<IconDeviceFloppy size={16} />} />
            </Stepper>

            <div style={{ minHeight: 400 }}>
                {currentStep === 0 && renderTriggerStep()}
                {currentStep === 1 && renderActionStep()}
                {currentStep === 2 && renderReviewStep()}
            </div>

            <Divider />

            <Flex justify="space-between">
                <Button variant="subtle" onClick={onCancel}>{t('UI_CANCEL')}</Button>
                <Group>
                    {currentStep > 0 && (
                        <Button onClick={() => setCurrentStep(prev => prev - 1)}>
                            {t('UI_PREVIOUS')}
                        </Button>
                    )}
                    {currentStep < 2 ? (
                        <Button
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            disabled={currentStep === 0 && !selectedTrigger}
                        >
                            {t('UI_NEXT')}
                        </Button>
                    ) : (
                        <Button
                            leftSection={<IconDeviceFloppy size={16} />}
                            onClick={handleSave}
                            loading={createRule.isPending || updateRule.isPending}
                            disabled={actions.length === 0}
                        >
                            {ruleToEdit ? t('UI_UPDATE_RULE') : t('UI_CREATE_RULE')}
                        </Button>
                    )}
                </Group>
            </Flex>
        </div>
    );
}
