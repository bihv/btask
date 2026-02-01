import React, { useState, useEffect } from 'react';
import { Button, Modal, Space, Select, Input, Typography } from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TriggerDateModalProps {
    value?: { type: string; operator: string; range?: string; condition?: string; amount?: string; unit?: string; direction?: string };
    onChange: (val: any) => void;
    hasValue?: boolean;
}

export const TriggerDateModal = ({ value, onChange, hasValue }: TriggerDateModalProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Row 1 State
    const [rangeOperator, setRangeOperator] = useState('in');
    const [rangeValue, setRangeValue] = useState('this_week');

    // Row 2 State
    const [relativeCondition, setRelativeCondition] = useState('less_than');
    const [relativeAmount, setRelativeAmount] = useState('1');
    const [relativeAmount2, setRelativeAmount2] = useState('5');
    const [relativeUnit, setRelativeUnit] = useState('days');
    const [relativeDirection, setRelativeDirection] = useState('from_now');

    const handleAddRange = () => {
        onChange({
            type: 'range',
            operator: rangeOperator,
            range: rangeValue,
            text: `${rangeOperator.replace('_', ' ')} ${rangeValue.replace('_', ' ')}`
        });
        setIsModalOpen(false);
    };

    const handleAddRelative = () => {
        let text = `${relativeCondition.replace('_', ' ')} ${relativeAmount} ${relativeUnit.replace('_', ' ')} ${relativeDirection.replace('_', ' ')}`;
        if (relativeCondition === 'between') {
            text = `between ${relativeAmount} and ${relativeAmount2} ${relativeUnit.replace('_', ' ')} ${relativeDirection.replace('_', ' ')}`;
        }

        onChange({
            type: 'relative',
            condition: relativeCondition,
            amount: relativeAmount,
            amount2: relativeAmount2,
            unit: relativeUnit,
            direction: relativeDirection,
            text
        });
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                icon={<CalendarOutlined />}
                size="small"
                type={hasValue ? 'primary' : 'default'}
                onClick={() => setIsModalOpen(true)}
            />
            <Modal
                title="Filter Date"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
                destroyOnClose={true}
            >
                <Space direction="vertical" style={{ width: '100%', gap: 16 }}>
                    {/* Row 1: Range */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                            <Select value={rangeOperator} onChange={setRangeOperator} style={{ width: 100 }}>
                                <Select.Option value="in">in</Select.Option>
                                <Select.Option value="not_in">not in</Select.Option>
                            </Select>
                            <Select value={rangeValue} onChange={setRangeValue} style={{ width: 120 }}>
                                <Select.Option value="this_week">this week</Select.Option>
                                <Select.Option value="next_week">next week</Select.Option>
                                <Select.Option value="this_month">this month</Select.Option>
                                <Select.Option value="next_month">next month</Select.Option>
                            </Select>
                        </Space>
                        <Button type="text" icon={<PlusOutlined />} onClick={handleAddRange} />
                    </div>

                    {/* Row 2: Relative */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                            <Select value={relativeCondition} onChange={setRelativeCondition} style={{ width: 110 }}>
                                <Select.Option value="less_than">less than</Select.Option>
                                <Select.Option value="more_than">more than</Select.Option>
                                <Select.Option value="between">between</Select.Option>
                            </Select>
                            <Input
                                value={relativeAmount}
                                onChange={(e) => setRelativeAmount(e.target.value)}
                                style={{ width: 60 }}
                            />
                            {relativeCondition === 'between' && (
                                <>
                                    <Text>and</Text>
                                    <Input
                                        value={relativeAmount2}
                                        onChange={(e) => setRelativeAmount2(e.target.value)}
                                        style={{ width: 60 }}
                                    />
                                </>
                            )}
                            <Select value={relativeUnit} onChange={setRelativeUnit} style={{ width: 120 }}>
                                <Select.Option value="days">days</Select.Option>
                                <Select.Option value="working_days">working days</Select.Option>
                            </Select>
                            <Select value={relativeDirection} onChange={setRelativeDirection} style={{ width: 110 }}>
                                <Select.Option value="from_now">from now</Select.Option>
                                <Select.Option value="ago">ago</Select.Option>
                            </Select>
                        </Space>
                        <Button type="text" icon={<PlusOutlined />} onClick={handleAddRelative} />
                    </div>
                </Space>
            </Modal>
        </>
    );

};
