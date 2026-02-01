import React, { useState } from 'react';
import { Space, Select, Button, Typography, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rowStyle } from './styles';

const { Option } = Select;
const { Text } = Typography;

interface ContentTabProps {
    onAdd: (filter: any) => void;
}

export const ContentTab = ({ onAdd }: ContentTabProps) => {

    const ContentRow = () => {
        const [target, setTarget] = useState('name'); // name, desc, name_or_desc
        const [operator, setOperator] = useState('starting');
        const [textVal, setTextVal] = useState('');
        const [mode] = useState('with');
        const [error, setError] = useState(false);

        const handleAdd = () => {
            if (textVal && textVal.trim() !== '') {
                const targetText = target === 'name' ? 'a name' : target === 'desc' ? 'a description' : 'a name or description';
                const opText = operator.replace('_', ' ');
                onAdd({ type: 'content', subtype: 'text_match', mode, target, operator, value: textVal, text: `${mode} ${targetText} ${opText} "${textVal}"` });
                setError(false);
            } else {
                setError(true);
            }
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Text>with</Text>
                    <Select value={target} style={{ width: 120 }} onChange={setTarget}>
                        <Option value="name">a name</Option>
                        <Option value="desc">a description</Option>
                        <Option value="name_or_desc">a name or desc</Option>
                    </Select>
                    <Select value={operator} style={{ width: 140 }} onChange={setOperator}>
                        <Option value="starting">starting with</Option>
                        <Option value="ending">ending with</Option>
                        <Option value="containing">containing</Option>
                        <Option value="not_starting">not starting with</Option>
                        <Option value="not_ending">not ending with</Option>
                        <Option value="not_containing">not containing</Option>
                    </Select>
                    <Input
                        placeholder="text"
                        value={textVal}
                        status={error ? 'error' : ''}
                        onChange={e => {
                            setTextVal(e.target.value);
                            setError(false);
                        }}
                        style={{ width: 100 }}
                    />
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <ContentRow />
            <div style={rowStyle}>
                <Space wrap>
                    <Select defaultValue="with" style={{ width: 80 }}><Option value="with">with</Option><Option value="without">without</Option></Select>
                    <Text>an empty description</Text>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={() => onAdd({ type: 'content', subtype: 'empty_desc', text: 'with an empty description' })} />
            </div>
        </Space>
    );
};
