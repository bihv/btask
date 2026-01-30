import React, { useState } from 'react';
import { Space, Select, Button, Typography, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rowStyle } from './styles';

const { Option } = Select;
const { Text } = Typography;

interface DatesTabProps {
    onAdd: (filter: any) => void;
}

export const DatesTab = ({ onAdd }: DatesTabProps) => {

    const AdvancedDateRow = ({ onAdd }: { onAdd: (f: any) => void }) => {
        const [type, setType] = useState('due');
        const [operator, setOperator] = useState('less');
        const [val1, setVal1] = useState('1');
        const [val2, setVal2] = useState('5');
        const [unit, setUnit] = useState('days');

        const handleAdd = () => {
            let text = `${type} ${operator.replace('_', ' ')} ${val1}`;
            if (operator === 'in_between') {
                text += ` and ${val2}`;
            }
            text += ` ${unit.replace('_', ' ')}`;
            onAdd({ type: 'date', subtype: 'advanced', dateType: type, operator, val1, val2, unit, text });
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Select value={type} style={{ width: 90 }} onChange={setType}>
                        <Option value="due">due</Option>
                        <Option value="starting">starting</Option>
                    </Select>
                    <Select value={operator} style={{ width: 120 }} onChange={setOperator}>
                        <Option value="less">in less than</Option>
                        <Option value="more">in more than</Option>
                        <Option value="in">in</Option>
                        <Option value="in_between">in between</Option>
                    </Select>
                    <Input value={val1} onChange={e => setVal1(e.target.value)} style={{ width: 60 }} />
                    {operator === 'in_between' && (
                        <>
                            <Text>and</Text>
                            <Input value={val2} onChange={e => setVal2(e.target.value)} style={{ width: 60 }} />
                        </>
                    )}
                    <Select value={unit} style={{ width: 120 }} onChange={setUnit}>
                        <Option value="days">days</Option>
                        <Option value="working_days">working days</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {/* Row 1: Due Date Presence */}
            <div style={rowStyle}>
                <Space wrap>
                    <Select defaultValue="with" style={{ width: 90 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Select defaultValue="a" style={{ width: 110 }}>
                        <Option value="a">a</Option>
                        <Option value="an_overdue">an overdue</Option>
                    </Select>
                    <Text>due date</Text>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={() => onAdd({ type: 'date', subtype: 'due_presence', text: 'with a due date' })} />
            </div>

            {/* Row 2: Start Date Presence */}
            <div style={rowStyle}>
                <Space wrap>
                    <Select defaultValue="with" style={{ width: 90 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>a start date</Text>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={() => onAdd({ type: 'date', subtype: 'start_presence', text: 'with a start date' })} />
            </div>

            {/* Row 3: Relative Date */}
            <div style={rowStyle}>
                <Space wrap>
                    <Select defaultValue="due" style={{ width: 110 }}>
                        <Option value="due">due</Option>
                        <Option value="not_due">not due</Option>
                        <Option value="starting">starting</Option>
                        <Option value="not_starting">not starting</Option>
                    </Select>
                    <Select defaultValue="today" style={{ width: 120 }}>
                        <Option value="today">today</Option>
                        <Option value="tomorrow">tomorrow</Option>
                        <Option value="this_week">this week</Option>
                        <Option value="next_week">next week</Option>
                        <Option value="this_month">this month</Option>
                        <Option value="next_month">next month</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={() => onAdd({ type: 'date', subtype: 'relative', text: 'due today' })} />
            </div>

            {/* Row 4: Advanced Date */}
            <AdvancedDateRow onAdd={onAdd} />
        </Space>
    );
};
