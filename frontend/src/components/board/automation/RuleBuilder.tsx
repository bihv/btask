'use client';

import { useState } from 'react';
import { Steps, Form, Input, Select, Button, Space, Card, Typography, Divider } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreateRule } from '@/hooks/useAutomation';
import { useBoard } from '@/hooks/useBoards';

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
    const lists = board?.lists || [];

    const handleFinish = async (values: any) => {
        // Transform form data to API format
        const payload = {
            name: values.name,
            trigger_type: 'event',
            trigger_config: {
                event: values.triggerEvent,
                conditions: [] // Phase 3
            },
            actions: values.actions.map((action: any) => ({
                type: action.type,
                ...action.config
            })),
            board_id: boardId,
        };

        try {
            await createRule.mutateAsync(payload);
            onSuccess();
        } catch (e) {
            // handled by hook
        }
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
                    <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g., Move to Done when completed" />
                    </Form.Item>
                    
                    <Form.Item name="triggerEvent" label="When this happens..." rules={[{ required: true }]}>
                        <Select placeholder="Select a trigger">
                            <Select.Option value="card.created">Card Created</Select.Option>
                            <Select.Option value="card.moved">Card Moved</Select.Option>
                            <Select.Option value="card.label_added">Label Added</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                {/* STEP 2: ACTIONS */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Perform these actions...
                    </Text>
                    
                    <Form.List name="actions">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} size="small" style={{ marginBottom: 10 }}>
                                        <Space align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'type']}
                                                rules={[{ required: true }]}
                                            >
                                                <Select style={{ width: 150 }} placeholder="Action Type">
                                                    <Select.Option value="move_card">Move Card</Select.Option>
                                                    <Select.Option value="archive_card">Archive Card</Select.Option>
                                                    {/* Add more actions */}
                                                </Select>
                                            </Form.Item>

                                            <Form.Item
                                                shouldUpdate={(prev, curr) => 
                                                    prev.actions?.[name]?.type !== curr.actions?.[name]?.type
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const type = getFieldValue(['actions', name, 'type']);
                                                    if (type === 'move_card') {
                                                        return (
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'config', 'list_id']}
                                                                rules={[{ required: true, message: 'Select a list' }]}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Select style={{ width: 200 }} placeholder="Select List">
                                                                    {lists.map((l: any) => (
                                                                        <Select.Option key={l.id} value={l.id}>{l.title}</Select.Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            </Form.Item>

                                            <Button type="text" danger onClick={() => remove(name)}>Remove</Button>
                                        </Space>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Action
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>

                {/* STEP 3: REVIEW */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <Card>
                        <Title level={5}>{form.getFieldValue('name')}</Title>
                        <Divider />
                        <Paragraph>
                            <strong>When:</strong> {form.getFieldValue('triggerEvent')}
                        </Paragraph>
                        <Paragraph>
                            <strong>Then:</strong> {form.getFieldValue('actions')?.length} actions
                        </Paragraph>
                    </Card>
                </div>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    {currentStep > 0 && (
                        <Button style={{ margin: '0 8px' }} onClick={() => setCurrentStep(currentStep - 1)}>
                            Previous
                        </Button>
                    )}
                    {currentStep < 2 && (
                        <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                            Next
                        </Button>
                    )}
                    {currentStep === 2 && (
                        <Button type="primary" htmlType="submit" loading={createRule.isPending}>
                            Create Rule
                        </Button>
                    )}
                    <Button type="text" onClick={onCancel} style={{ marginLeft: 8 }}>
                        Cancel
                    </Button>
                </div>
            </Form>
        </div>
    );
}
