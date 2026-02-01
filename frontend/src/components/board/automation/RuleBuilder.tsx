'use client';

import { useState } from 'react';
import { Steps, Form, Input, Select, Button, Space, Card, Typography, Divider, Tabs, List, Tag, Popover, Switch, Tooltip } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, UnorderedListOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useCreateRule } from '@/hooks/useAutomation';
import { useBoard } from '@/hooks/useBoards';
import { TRIGGER_CATEGORIES, TRIGGER_TEMPLATES, TriggerOption, TriggerPart } from './automationTypes';
import { TriggerFilterModal } from './TriggerFilterModal';
import { TriggerUserModal } from './TriggerUserModal';
import { TriggerDateModal } from './TriggerDateModal';
import { TriggerTextMatchModal } from './TriggerTextMatchModal';

const { Text, Title, Paragraph } = Typography;

interface RuleBuilderProps {
    boardId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function RuleBuilder({ boardId, onCancel, onSuccess }: RuleBuilderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const createRule = useCreateRule();
    const { data: board } = useBoard(boardId);

    // Data for popovers
    const lists = board?.lists || [];
    const labels = board?.labels || [];
    const members = (board as any)?.members || [];

    // Mocking fields since we don't have them in props yet properly
    const customFields = [
        { id: 'f1', name: 'Priority', type: 'number' },
        { id: 'f2', name: 'Status', type: 'text' },
        { id: 'f3', name: 'Start Date', type: 'date' },
        { id: 'f4', name: 'Verified', type: 'checkbox' },
        { id: 'f5', name: 'Story Points', type: 'number' },
        { id: 'f6', name: 'Location', type: 'text' },
    ];

    // State for Trigger Builder
    const [activeCategory, setActiveCategory] = useState<string>('card_move');
    const [triggerConfig, setTriggerConfig] = useState<any>({}); // Store configurations for each trigger ID
    const [isAdvanced, setIsAdvanced] = useState(true);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    const validateTrigger = (triggerId: string, template: TriggerOption, config: any) => {
        const errors: string[] = [];

        template.parts.forEach(part => {
            // 1. Check Visibility (Copy of render logic)
            if (template.id === 'date_changed' && part.key === 'comparison') {
                const currentVerb = config['verb'] || 'set on';
                if (currentVerb === 'removed from') return;
            }
            if ((template.id === 'checklist_completed' || template.id === 'checklist_item_added') && part.key === 'checklist_name') {
                const currentScope = config['scope'] || 'checklist';
                if (currentScope !== 'checklist') return;
            }
            if (template.id === 'checklist_item_state_changed' && part.key === 'item_name') {
                const currentScope = config['scope'] || 'the';
                if (currentScope === 'an') return;
            }

            // 2. Validate based on type
            if (!part.key) return; // Static parts or no key

            // Use config value if present, otherwise fallback to default value from template
            const val = config[part.key] !== undefined ? config[part.key] : part.value;

            switch (part.type) {
                case 'static':
                case 'filter':
                case 'user':
                    return; // Ignore

                case 'custom_field_multi_select':
                    if (!val || val.length === 0) errors.push(part.key);
                    break;

                case 'input_text':
                    if (part.icon === 'list') {
                        // Checklist name special case: if rendered, it is required? defaulting to null in state
                        // Logical check: if visible (passed check above), it requires value
                        if (!val) errors.push(part.key);
                    } else {
                        if (!val) errors.push(part.key);
                    }
                    break;

                case 'number_comparison':
                    // Usually has default, but just in case
                    if (!val) {
                        // It usually initializes
                    }
                    break;

                default:
                    // Selects, etc.
                    if (val === undefined || val === null || val === '') {
                        errors.push(part.key);
                    }
            }
        });

        return errors;
    };


    const handleUpdateTrigger = (triggerId: string, key: string, value: any) => {
        setTriggerConfig((prev: any) => ({
            ...prev,
            [triggerId]: {
                ...prev[triggerId],
                [key]: value
            }
        }));
        // Clear error for this field if exists
        if (validationErrors[triggerId]?.includes(key)) {
            setValidationErrors(prev => ({
                ...prev,
                [triggerId]: prev[triggerId].filter(k => k !== key)
            }));
        }
    };

    const renderTriggerPart = (part: TriggerPart, triggerId: string) => {
        const config = triggerConfig[triggerId] || {};
        const errors = validationErrors[triggerId] || [];
        const hasError = part.key ? errors.includes(part.key) : false;

        switch (part.type) {
            case 'custom_field_multi_select':
                const selectedIds = config[part.key!] || [];
                // Helper to add a field
                const handleAddField = (id: string) => {
                    const newIds = [...selectedIds, id];
                    handleUpdateTrigger(triggerId, part.key!, newIds);
                };
                // Helper to remove a field
                const handleRemoveField = (id: string) => {
                    handleUpdateTrigger(triggerId, part.key!, selectedIds.filter((sid: string) => sid !== id));
                };

                const availableFields = customFields.filter(f => !selectedIds.includes(f.id));

                return (
                    <Space>
                        {selectedIds.map((id: string) => {
                            const field = customFields.find(f => f.id === id);
                            return (
                                <Tag key={id} closable onClose={() => handleRemoveField(id)}>
                                    {field?.name || id}
                                </Tag>
                            );
                        })}
                        <Popover
                            trigger="click"
                            content={
                                <List
                                    size="small"
                                    dataSource={availableFields}
                                    renderItem={(f: any) => (
                                        <List.Item
                                            onClick={() => handleAddField(f.id)}
                                            style={{ cursor: 'pointer', padding: '4px 8px' }}
                                        >
                                            {f.name}
                                        </List.Item>
                                    )}
                                    style={{ width: 200, maxHeight: 300, overflow: 'auto' }}
                                />
                            }
                        >
                            <Button size="small" icon={<PlusOutlined />} danger={hasError} />
                        </Popover>
                    </Space>
                );

            case 'number_comparison':
                const compConfig = config[part.key!] || { condition: 'greater than', value: '0' };
                const updateComp = (key: string, val: any) => {
                    const newConfig = { ...compConfig, [key]: val };
                    // If toggling secondary off, remove it
                    if (key === 'hasSecondary' && !val) {
                        delete newConfig.secondaryCondition;
                        delete newConfig.secondaryValue;
                    }
                    handleUpdateTrigger(triggerId, part.key!, newConfig);
                };

                return (
                    <Space>
                        <Select
                            value={compConfig.condition}
                            style={{ width: 140 }}
                            onChange={(val) => updateComp('condition', val)}
                        >
                            {['greater than', 'greater or equal to', 'less than', 'less or equal to', 'equal to'].map(opt => (
                                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                        </Select>
                        <Input
                            value={compConfig.value}
                            style={{ width: 60 }}
                            onChange={(e) => updateComp('value', e.target.value)}
                        />
                        {compConfig.hasSecondary ? (
                            <>
                                <Text>and</Text>
                                <Select
                                    value={compConfig.secondaryCondition || 'less than'}
                                    style={{ width: 140 }}
                                    onChange={(val) => updateComp('secondaryCondition', val)}
                                >
                                    {['greater than', 'greater or equal to', 'less than', 'less or equal to', 'equal to'].map(opt => (
                                        <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                    ))}
                                </Select>
                                <Input
                                    value={compConfig.secondaryValue || '0'}
                                    style={{ width: 60 }}
                                    onChange={(e) => updateComp('secondaryValue', e.target.value)}
                                />
                                <Button
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => updateComp('hasSecondary', false)}
                                />
                            </>
                        ) : (
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => updateComp('hasSecondary', true)}
                            />
                        )}
                    </Space>
                );

            case 'custom_field_select':
                const filteredFields = customFields.filter(f => !part.filterType || f.type === part.filterType || (part.filterType === 'text' && f.type === 'number')); // Text can often match number too for value
                return (
                    <Select
                        placeholder="Field"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        dropdownMatchSelectWidth={false}
                        status={hasError ? 'error' : ''}
                    >
                        {filteredFields.map((f: any) => (
                            <Select.Option key={f.id} value={f.id}>
                                {f.name}
                            </Select.Option>
                        ))}
                    </Select>
                );

            case 'static':
                return (
                    <Text>
                        {part.value}
                        {part.tooltip && (
                            <Tooltip title={part.tooltip}>
                                <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 }} />
                            </Tooltip>
                        )}
                    </Text>
                );

            case 'filter':
                return (
                    <Space size={2}>
                        {config.filters?.map((f: any, i: number) => (
                            <Tag
                                key={i}
                                closable
                                onClose={() => {
                                    const newFilters = [...config.filters];
                                    newFilters.splice(i, 1);
                                    handleUpdateTrigger(triggerId, 'filters', newFilters);
                                }}
                            >
                                {f.text}
                            </Tag>
                        ))}
                        {isAdvanced && (
                            <TriggerFilterModal
                                value={config.filters}
                                onChange={(val) => handleUpdateTrigger(triggerId, 'filters', val)}
                                lists={lists}
                                labels={labels}
                                members={members}
                                showInactive={activeCategory !== 'card_move'}
                            />
                        )}
                    </Space>
                );

            case 'user':
                return (
                    <Space size={2}>
                        {config.user && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, 'user', null)}
                            >
                                {config.user.text}
                            </Tag>
                        )}
                        <TriggerUserModal
                            value={config.user}
                            onChange={(val) => handleUpdateTrigger(triggerId, 'user', val)}
                            members={members}
                            hasValue={!!config.user}
                        />
                    </Space>
                );

            case 'verb_select':
                return (
                    <Select
                        value={config[part.key!] || part.value}
                        style={{ width: 140 }}
                        bordered={false}
                        className="trigger-select"
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {part.options?.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                    </Select>
                );

            case 'list_select':
                return (
                    <Select
                        showSearch={{
                            filterOption: (input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }}
                        placeholder="List name"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {lists.map((l: any) => <Select.Option key={l.id} value={l.id}>{l.title}</Select.Option>)}
                    </Select>
                );

            case 'input_number':
                // For now simple input, maybe input number later
                return <Input style={{ width: 60 }} defaultValue={part.value} status={hasError ? 'error' : ''} />;

            case 'input_text':
                if (part.icon === 'list') {
                    const hasValue = config[part.key!] !== undefined && config[part.key!] !== null;
                    if (!hasValue) {
                        return (
                            <Button
                                size="small"
                                icon={<UnorderedListOutlined />}
                                onClick={() => handleUpdateTrigger(triggerId, part.key!, '')}
                                danger={hasError}
                            />
                        );
                    }

                    return (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#1f1f1f',
                            border: '1px solid #303030',
                            borderRadius: 4,
                            padding: '2px 8px',
                            gap: 8
                        }}>
                            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>in a checklist named</Text>
                            <Input
                                placeholder={part.placeholder}
                                value={config[part.key!]}
                                style={{ width: 140, border: 'none', padding: '0 4px', background: 'transparent' }}
                                onChange={(e) => handleUpdateTrigger(triggerId, part.key!, e.target.value)}
                                status={hasError ? 'error' : ''}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<span style={{ fontSize: 10 }}>✕</span>}
                                onClick={() => handleUpdateTrigger(triggerId, part.key!, null)}
                                style={{ color: '#595959', minWidth: 20, height: 20, padding: 0 }}
                            />
                        </div>
                    );
                }

                return (
                    <Input
                        placeholder={part.placeholder}
                        value={config[part.key!]}
                        style={{ width: 140 }}
                        onChange={(e) => handleUpdateTrigger(triggerId, part.key!, e.target.value)}
                        status={hasError ? 'error' : ''}
                    />
                );

            case 'condition_group':
                // Placeholder
                return <Button size="small" icon={<PlusOutlined />} />;

            case 'label_select':
                return (
                    <Select
                        placeholder="Label"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        dropdownMatchSelectWidth={false}
                        status={hasError ? 'error' : ''}
                    >
                        {labels.map((l: any) => (
                            <Select.Option key={l.id} value={l.id}>
                                <Space>
                                    <div style={{ width: 16, height: 16, backgroundColor: l.color, borderRadius: 2 }} />
                                    {l.name}
                                </Space>
                            </Select.Option>
                        ))}
                    </Select>
                );

            case 'member_select':
                return (
                    <Select
                        showSearch={{
                            filterOption: (input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }}
                        placeholder="@username"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {members.map((m: any) => <Select.Option key={m.id} value={m.id}>{m.username}</Select.Option>)}
                    </Select>
                );

            case 'text_match':
                const matchConfig = config[part.key!] || { condition: 'starting_with', text: '' };
                const hasValue = matchConfig.text && matchConfig.text.length > 0;

                const iconNode = part.icon === 'list' ? <span style={{ fontWeight: 'bold' }}>≣</span> : <span style={{ fontWeight: 600 }}>T</span>;

                return (
                    <Space size={2}>
                        {hasValue && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, part.key!, { ...matchConfig, text: '' })}
                            >
                                {matchConfig.condition.replace(/_/g, ' ')} "{matchConfig.text}"
                            </Tag>
                        )}
                        <TriggerTextMatchModal
                            value={matchConfig}
                            hasValue={hasValue}
                            onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                            customIcon={iconNode}
                        />
                    </Space>
                );

            case 'date_comparison':
                const dateConfig = config[part.key!] || null;
                const hasDateValue = !!dateConfig;

                return (
                    <Space size={2}>
                        {hasDateValue && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, part.key!, null)}
                            >
                                {dateConfig.text}
                            </Tag>
                        )}
                        <TriggerDateModal
                            value={dateConfig}
                            hasValue={hasDateValue}
                            onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        />
                    </Space>
                );
            default:
                return null;
        }
    };

    const handleFinish = async (values: any) => {
        // ... Logic to construct payload based on selected Trigger (needs a selection state)
        // For prototype, assuming first one in category or explicit selection
        // Phase 3 implementation
        onSuccess();
    };

    return (
        <div style={{ paddingTop: 10 }}>
            <Steps
                current={currentStep}
                items={[
                    { title: 'Trigger', icon: <ThunderboltOutlined /> },
                    { title: 'Actions', icon: <PlayCircleOutlined /> },
                    { title: 'Review', icon: <SaveOutlined /> },
                ]}
                style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical" onFinish={handleFinish}>

                {/* STEP 1: TRIGGER */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>

                    {/* Categories */}
                    <Space style={{ marginBottom: 16 }}>
                        {TRIGGER_CATEGORIES.map(cat => (
                            <Button
                                key={cat.id}
                                type={activeCategory === cat.id ? 'primary' : 'default'}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </Space>

                    <Space style={{ float: 'right' }}>
                        <Switch
                            checkedChildren="Advanced"
                            unCheckedChildren="Basic"
                            checked={isAdvanced}
                            onChange={setIsAdvanced}
                        />
                    </Space>

                    {/* Trigger List */}
                    <List
                        dataSource={TRIGGER_TEMPLATES.filter(t => t.category === activeCategory)}
                        renderItem={item => (
                            <List.Item>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Space wrap style={{ flex: 1, marginRight: 16 }}>
                                        {item.parts.map((part, index) => {
                                            const currentConfig = triggerConfig[item.id] || {};

                                            // Special Condition: Hide 'comparison' if verb is 'removed from' for date_changed
                                            if (item.id === 'date_changed' && part.key === 'comparison') {
                                                const currentVerb = currentConfig['verb'] || 'set on';
                                                if (currentVerb === 'removed from') return null;
                                            }

                                            // Special Condition: Hide 'checklist_name' if scope is 'a checklist' or 'all checklists'
                                            if ((item.id === 'checklist_completed' || item.id === 'checklist_item_added') && part.key === 'checklist_name') {
                                                const currentScope = currentConfig['scope'] || 'checklist';
                                                if (currentScope !== 'checklist') return null;
                                            }

                                            // Special Condition: Hide 'item_name' if scope is 'an' for checklist_item_state_changed
                                            if (item.id === 'checklist_item_state_changed' && part.key === 'item_name') {
                                                const currentScope = currentConfig['scope'] || 'the';
                                                if (currentScope === 'an') return null;
                                            }

                                            return (
                                                <div key={index}>
                                                    {renderTriggerPart(part, item.id)}
                                                </div>
                                            );
                                        })}
                                    </Space>
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            // Handle add rule
                                            const errors = validateTrigger(item.id, item, triggerConfig[item.id] || {});
                                            if (errors.length > 0) {
                                                setValidationErrors(prev => ({ ...prev, [item.id]: errors }));
                                            } else {
                                                // Proceed
                                                // setTriggerId(item.id); 
                                                // setCurrentStep(1);
                                            }
                                        }}
                                    />
                                </div>
                            </List.Item>
                        )}
                        style={{ background: '#141414', borderRadius: 8, padding: 8 }} // Dark theme mock
                        className="trigger-list"
                    />

                    {/* Filters Display (Tags) for each row - tricky in List, maybe integrated in renderTriggerPart? 
                        Displaying selected filters as tags inline
                    */}
                </div>

                {/* STEP 2 & 3: Keep existing for now to focus on Trigger */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <p>Actions Placeholder</p>
                </div>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    {currentStep > 0 && <Button style={{ margin: '0 8px' }} onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>}
                    {currentStep > 0 && currentStep < 2 && <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>}
                </div>
            </Form>
        </div>
    );
}
