'use client';

import { useState, useMemo, useEffect } from 'react';
import { Steps, Form, Input, Button, Space, Card, Typography, List, Tag, Switch, theme, Empty, Spin, Alert, Divider, Flex, App } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useBoard, useAllBoards } from '@/hooks/useBoards';
import {
    useTriggersByCategory,
    useActionsByCategory,
    useCreateRule,
    useUpdateRule,
} from '@/hooks/useAutomationSchema';
import type { TriggerSchema, ActionSchema, PropertySchema, AutomationRule } from '@/types/automation';
import { TRIGGER_CATEGORY_INFO, ACTION_CATEGORY_INFO } from '@/types/automation';
import SentenceTemplateRenderer, { SentenceDisplay } from './SentenceTemplateRenderer';

const { Text, Title } = Typography;

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
    const { token } = theme.useToken();
    const { message } = App.useApp();
    const [form] = Form.useForm();

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
            message.error('Please select a trigger and at least one action');
            return;
        }

        // Validate required fields in actions
        for (const action of actions) {
            const schema = allActions.find(s => s.id === action.id);
            if (schema) {
                for (const prop of schema.properties) {
                    if (prop.required && (action[prop.name] === undefined || action[prop.name] === null || action[prop.name] === '')) {
                        message.error(`Please fill in "${prop.label || prop.name}" for action "${schema.name}"`);
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
            // trigger_type is always 'event' for event-based rules
            trigger_type: 'event' as const,
            trigger_config: { ...triggerConfig, id: selectedTrigger.id },
            // Use action objects directly - they contain the latest config
            actions: actions.map(a => ({ ...a })),
            is_enabled: isEnabled,
        };

        try {
            if (ruleToEdit) {
                await updateRule.mutateAsync({ id: ruleToEdit.id, data: ruleData });
                message.success('Rule updated successfully');
            } else {
                await createRule.mutateAsync(ruleData);
                message.success('Rule created successfully');
            }
            onSuccess();
        } catch (error: any) {
            message.error(error.message || 'Failed to save rule');
        }
    };

    // Loading state
    if (loadingTriggers || loadingActions) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading automation schema...</div>
            </div>
        );
    }

    // Empty state
    if (allTriggers.length === 0 && allActions.length === 0) {
        return (
            <Alert
                type="warning"
                message="No automation triggers or actions available"
                description="The automation system has not been initialized properly."
                style={{ margin: 40 }}
            />
        );
    }

    // Render trigger selection step
    const renderTriggerStep = () => (
        <Flex gap={24}>
            {/* Category sidebar */}
            <div style={{ width: 160 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {triggerCategories.map(cat => (
                        <Button
                            key={cat.id}
                            type={activeCategory === cat.id ? 'primary' : 'default'}
                            onClick={() => setActiveCategory(cat.id)}
                            block
                        >
                            {cat.label}
                        </Button>
                    ))}
                </Space>
            </div>

            {/* Trigger list */}
            <div style={{ flex: 1 }}>
                <List
                    dataSource={triggersByCategory[activeCategory] || []}
                    renderItem={(trigger: TriggerSchema) => (
                        <List.Item
                            onClick={() => handleSelectTrigger(trigger)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: selectedTrigger?.id === trigger.id 
                                    ? token.colorPrimaryBg 
                                    : 'transparent',
                                borderRadius: 8,
                                padding: '12px 16px',
                                marginBottom: 8,
                                border: selectedTrigger?.id === trigger.id 
                                    ? `1px solid ${token.colorPrimary}` 
                                    : '1px solid transparent',
                            }}
                        >
                            <List.Item.Meta
                                title={trigger.name}
                                description={trigger.description}
                            />
                            {selectedTrigger?.id === trigger.id && (
                                <CheckOutlined style={{ color: token.colorPrimary }} />
                            )}
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No triggers in this category' }}
                />

                {/* Trigger configuration */}
                {selectedTrigger && selectedTrigger.sentence_template && (
                    <Card 
                        title="Configure Trigger" 
                        size="small" 
                        style={{ marginTop: 16 }}
                    >
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
                <Space direction="vertical" style={{ width: '100%' }}>
                    {actionCategories.map(cat => (
                        <Button
                            key={cat.id}
                            type={activeActionCategory === cat.id ? 'primary' : 'default'}
                            onClick={() => setActiveActionCategory(cat.id)}
                            block
                        >
                            {cat.label}
                        </Button>
                    ))}
                </Space>
            </div>

            {/* Action list and selected actions */}
            <div style={{ flex: 1 }}>
                {/* Available actions */}
                <Title level={5}>Available Actions</Title>
                <List
                    size="small"
                    dataSource={actionsByCategory[activeActionCategory] || []}
                    renderItem={(action: ActionSchema) => (
                        <List.Item
                            style={{ padding: '8px 12px' }}
                            actions={[
                                <Button
                                    key="add"
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleAddAction(action)}
                                >
                                    Add
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={action.name}
                                description={action.description}
                            />
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No actions in this category' }}
                />

                <Divider />

                {/* Selected actions */}
                <Title level={5}>
                    Added Actions ({actions.length})
                </Title>
                {actions.length === 0 ? (
                    <Empty description="No actions added yet" />
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {actions.map((action, index) => {
                            const schema = allActions.find(a => a.id === action.id);
                            if (!schema) return null;

                            return (
                                <Card 
                                    key={`${action.id}-${index}`}
                                    size="small"
                                    extra={
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveAction(index)}
                                        />
                                    }
                                    title={schema.name}
                                >
                                    {schema.sentence_template ? (
                                        <SentenceTemplateRenderer
                                            template={schema.sentence_template}
                                            properties={propertiesToRecord(schema.properties)}
                                            config={actionConfigs[action.id] || action}
                                            onChange={(key, value) => handleUpdateActionProp(action.id, key, value)}
                                            context={context}
                                        />
                                    ) : (
                                        <Text type="secondary">No configuration needed</Text>
                                    )}
                                </Card>
                            );
                        })}
                    </Space>
                )}
            </div>
        </Flex>
    );

    // Render review step
    const renderReviewStep = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form form={form} layout="vertical">
                <Form.Item label="Rule Name">
                    <Input
                        value={ruleName}
                        onChange={e => setRuleName(e.target.value)}
                        placeholder="Enter rule name"
                    />
                </Form.Item>
                <Form.Item label="Enabled">
                    <Switch checked={isEnabled} onChange={setIsEnabled} />
                </Form.Item>
            </Form>

            <Card title="Summary" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>When: </Text>
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
                        <Text strong>Then: </Text>
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
                </Space>
            </Card>
        </Space>
    );

    return (
        <div style={{ padding: 16 }}>
            <Steps
                current={currentStep}
                items={[
                    { title: 'Trigger', icon: <ThunderboltOutlined /> },
                    { title: 'Actions', icon: <PlayCircleOutlined /> },
                    { title: 'Review', icon: <SaveOutlined /> },
                ]}
                style={{ marginBottom: 24 }}
            />

            <div style={{ minHeight: 400 }}>
                {currentStep === 0 && renderTriggerStep()}
                {currentStep === 1 && renderActionStep()}
                {currentStep === 2 && renderReviewStep()}
            </div>

            <Divider />

            <Flex justify="space-between">
                <Button onClick={onCancel}>Cancel</Button>
                <Space>
                    {currentStep > 0 && (
                        <Button onClick={() => setCurrentStep(prev => prev - 1)}>
                            Previous
                        </Button>
                    )}
                    {currentStep < 2 ? (
                        <Button 
                            type="primary" 
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            disabled={currentStep === 0 && !selectedTrigger}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={createRule.isPending || updateRule.isPending}
                            disabled={actions.length === 0}
                        >
                            {ruleToEdit ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    )}
                </Space>
            </Flex>
        </div>
    );
}
