'use client';

import { useState } from 'react';
import { Steps, Form, Input, Select, Button, Space, Card, Typography, Divider, Tabs, List, Tag, Popover, Switch } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCreateRule } from '@/hooks/useAutomation';
import { useBoard } from '@/hooks/useBoards';
import { TRIGGER_CATEGORIES, TRIGGER_TEMPLATES, TriggerOption, TriggerPart } from './automationTypes';
import { TriggerFilterModal } from './TriggerFilterModal';
import { TriggerUserModal } from './TriggerUserModal';

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

    // State for Trigger Builder
    const [activeCategory, setActiveCategory] = useState<string>('card_move');
    const [triggerConfig, setTriggerConfig] = useState<any>({}); // Store configurations for each trigger ID
    const [isAdvanced, setIsAdvanced] = useState(true);

    const handleUpdateTrigger = (triggerId: string, key: string, value: any) => {
        setTriggerConfig((prev: any) => ({
            ...prev,
            [triggerId]: {
                ...prev[triggerId],
                [key]: value
            }
        }));
    };

    const renderTriggerPart = (part: TriggerPart, triggerId: string) => {
        const config = triggerConfig[triggerId] || {};

        switch (part.type) {
            case 'static':
                return <Text>{part.value}</Text>;

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
                    >
                        {lists.map((l: any) => <Select.Option key={l.id} value={l.id}>{l.title}</Select.Option>)}
                    </Select>
                );

            case 'input_number':
                // For now simple input, maybe input number later
                return <Input style={{ width: 60 }} defaultValue={part.value} />;

            case 'condition_group':
                // Placeholder
                return <Button size="small" icon={<PlusOutlined />} />;

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
                                        {item.parts.map((part, idx) => (
                                            <div key={idx} style={{ display: 'inline-block' }}>
                                                {renderTriggerPart(part, item.id)}
                                            </div>
                                        ))}
                                    </Space>
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            // Here we would ideally set the selected trigger ID
                                            // setTriggerId(item.id); 
                                            setCurrentStep(1);
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
