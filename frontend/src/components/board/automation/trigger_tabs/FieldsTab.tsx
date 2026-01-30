import React, { useState } from 'react';
import { Space, Select, Button, Typography, Input, Tag, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { rowStyle } from './styles';

const { Option } = Select;
const { Text } = Typography;

interface FieldsTabProps {
    customFields: any[];
    onAdd: (filter: any) => void;
}

export const FieldsTab = ({ customFields, onAdd }: FieldsTabProps) => {
    // Mocking fields since we don't have them in props yet properly
    const fields = [
        { id: 'f1', name: 'Priority', type: 'number' },
        { id: 'f2', name: 'Status', type: 'text' },
        { id: 'f3', name: 'Start Date', type: 'date' },
        { id: 'f4', name: 'Verified', type: 'checkbox' },
        { id: 'f5', name: 'Story Points', type: 'number' },
        { id: 'f6', name: 'Location', type: 'text' },
    ];

    const TypeInfo = ({ text }: { text: string }) => (
        <Tooltip title={text}>
            <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 4 }} />
        </Tooltip>
    );

    // Row 2: Specific Completed (Multi-select)
    const FieldsCompletedRow = () => {
        const [selectedFields, setSelectedFields] = useState<string[]>([]);
        const [currentField, setCurrentField] = useState<string>();
        const [mode, setMode] = useState('with');

        const handleAddFieldForRow = () => {
            if (currentField && !selectedFields.includes(currentField)) {
                setSelectedFields([...selectedFields, currentField]);
                setCurrentField(undefined);
            }
        };

        const handleAddFilter = () => {
            const names = selectedFields.map(id => fields.find(f => f.id === id)?.name).join(', ');
            onAdd({ type: 'field', subtype: 'completed', mode, value: selectedFields, text: `${mode} custom fields ${names} completed` });
        };

        return (
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select value={mode} style={{ width: 80 }} onChange={setMode}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom fields
                        <TypeInfo text="Supports all field types" />
                    </Text>
                    {selectedFields.map(id => (
                        <Tag key={id} closable onClose={() => setSelectedFields(selectedFields.filter(sid => sid !== id))}>
                            {fields.find(f => f.id === id)?.name}
                        </Tag>
                    ))}
                    <Select
                        style={{ width: 120 }}
                        placeholder="Field name"
                        value={currentField}
                        onChange={setCurrentField}
                    >
                        {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Button icon={<PlusOutlined />} size="small" onClick={handleAddFieldForRow} />
                    <Text>completed</Text>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAddFilter} />
            </div>
        );
    };

    // Row 6: Number Logic
    const FieldsNumberRow = () => {
        const [fieldId, setFieldId] = useState<string>();
        const [condition, setCondition] = useState('greater');
        const [val, setVal] = useState('1');
        const [mode, setMode] = useState('with');

        // Secondary condition
        const [showSecondary, setShowSecondary] = useState(false);
        const [condition2, setCondition2] = useState('less');
        const [val2, setVal2] = useState('10');

        const handleAdd = () => {
            const fName = fields.find(f => f.id === fieldId)?.name || 'Field';
            let text = `${mode} ${fName} set to a number ${condition.replace('_', ' ')} ${val} `;
            if (showSecondary) {
                text += ` and ${condition2.replace('_', ' ')} ${val2} `;
            }
            onAdd({
                type: 'field',
                subtype: 'number',
                mode,
                fieldId,
                condition,
                val,
                secondary: showSecondary ? { condition: condition2, val: val2 } : undefined,
                text
            });
        };

        return (
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select value={mode} style={{ width: 80 }} onChange={setMode}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports: Number" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name" value={fieldId} onChange={setFieldId}>
                        {fields.filter(f => f.type === 'number').map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Text>set to a number</Text>
                    <Select value={condition} style={{ width: 140 }} onChange={setCondition}>
                        <Option value="greater">greater than</Option>
                        <Option value="greater_equal">greater or equal to</Option>
                        <Option value="lower">lower than</Option>
                        <Option value="lower_equal">lower or equal to</Option>
                    </Select>
                    <Input value={val} onChange={e => setVal(e.target.value)} style={{ width: 60 }} />

                    {showSecondary ? (
                        <>
                            <Text>and</Text>
                            <Select value={condition2} style={{ width: 140 }} onChange={setCondition2}>
                                <Option value="greater">greater than</Option>
                                <Option value="greater_equal">greater or equal to</Option>
                                <Option value="lower">lower than</Option>
                                <Option value="lower_equal">lower or equal to</Option>
                            </Select>
                            <Input value={val2} onChange={e => setVal2(e.target.value)} style={{ width: 60 }} />
                            <Button icon={<CloseOutlined />} size="small" onClick={() => setShowSecondary(false)} />
                        </>
                    ) : (
                        <Button icon={<PlusOutlined />} size="small" onClick={() => setShowSecondary(true)} />
                    )}
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    // Row 8: Date Relative Logic
    const FieldsDateRelativeRow = () => {
        const [fieldId, setFieldId] = useState<string>();
        const [condition, setCondition] = useState('less');
        const [val1, setVal1] = useState('1');
        const [val2, setVal2] = useState('5'); // For between if needed
        const [unit, setUnit] = useState('days');
        const [relative, setRelative] = useState('from_now');
        const [mode, setMode] = useState('with');

        const handleAdd = () => {
            const fName = fields.find(f => f.id === fieldId)?.name || 'Field';
            let text = `${mode} ${fName} set to a date ${condition} ${val1} `;
            if (condition === 'between') text += ` and ${val2} `;
            text += ` ${unit} ${relative.replace('_', ' ')} `;
            onAdd({ type: 'field', subtype: 'date_relative', mode, fieldId, dateRelative: { condition, val1, val2, unit, relative }, text });
        };

        return (
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select value={mode} style={{ width: 80 }} onChange={setMode}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports: Date" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name" value={fieldId} onChange={setFieldId}>
                        {fields.filter(f => f.type === 'date').map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Text>set to a date</Text>
                    <Select value={condition} style={{ width: 100 }} onChange={setCondition}>
                        <Option value="less">less than</Option>
                        <Option value="more">more than</Option>
                        <Option value="between">between</Option>
                    </Select>
                    <Input value={val1} onChange={e => setVal1(e.target.value)} style={{ width: 50 }} />
                    {condition === 'between' && (
                        <>
                            <Text>and</Text>
                            <Input value={val2} onChange={e => setVal2(e.target.value)} style={{ width: 50 }} />
                        </>
                    )}
                    <Select value={unit} style={{ width: 100 }} onChange={setUnit}>
                        <Option value="days">days</Option>
                        <Option value="working_days">working days</Option>
                    </Select>
                    <Select value={relative} style={{ width: 100 }} onChange={setRelative}>
                        <Option value="from_now">from now</Option>
                        <Option value="ago">ago</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {/* Row 1 */}
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select defaultValue="with" style={{ width: 80 }}><Option value="with">with</Option><Option value="without">without</Option></Select>
                    <Text>all custom fields completed</Text>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={() => onAdd({ type: 'field', subtype: 'all_completed', text: 'with all custom fields completed' })} />
            </div>

            {/* Row 2 */}
            <FieldsCompletedRow />

            {/* Row 3: Set/Cleared */}
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select defaultValue="with" style={{ width: 80 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports all field types" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name">
                        {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Select defaultValue="set" style={{ width: 100 }}>
                        <Option value="set">set</Option>
                        <Option value="cleared">cleared</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" />
            </div>

            {/* Row 4: Value */}
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select defaultValue="with" style={{ width: 80 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports: Text, Number" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name">
                        {fields.filter(f => f.type === 'text' || f.type === 'number').map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Text>set to</Text>
                    <Input placeholder="Value" style={{ width: 100 }} />
                </Space>
                <Button icon={<PlusOutlined />} type="text" />
            </div>

            {/* Row 5: Checkbox */}
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select defaultValue="with" style={{ width: 80 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports: Checkbox" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name">
                        {fields.filter(f => f.type === 'checkbox').map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Select defaultValue="checked" style={{ width: 110 }}>
                        <Option value="checked">checked</Option>
                        <Option value="unchecked">unchecked</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" />
            </div>

            {/* Row 6: Number */}
            <FieldsNumberRow />

            {/* Row 7: Date Range */}
            <div style={rowStyle}>
                <Space wrap style={{ flex: 1 }}>
                    <Select defaultValue="with" style={{ width: 80 }}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                    </Select>
                    <Text>
                        custom field
                        <TypeInfo text="Supports: Date" />
                    </Text>
                    <Select style={{ width: 120 }} placeholder="Field name">
                        {fields.filter(f => f.type === 'date').map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                    </Select>
                    <Text>set to a date</Text>
                    <Select defaultValue="in" style={{ width: 80 }}>
                        <Option value="in">in</Option>
                        <Option value="not_in">not in</Option>
                    </Select>
                    <Select defaultValue="this_week" style={{ width: 110 }}>
                        <Option value="this_week">this week</Option>
                        <Option value="this_month">this month</Option>
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" />
            </div>

            {/* Row 8: Date Relative */}
            <FieldsDateRelativeRow />
        </Space>
    );
};
