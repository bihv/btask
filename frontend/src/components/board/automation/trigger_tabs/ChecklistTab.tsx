import React, { useState } from 'react';
import { Space, Select, Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rowStyle } from './styles';

const { Option } = Select;

interface ChecklistTabProps {
    onAdd: (filter: any) => void;
}

export const ChecklistTab = ({ onAdd }: ChecklistTabProps) => {

    const ChecklistRow = () => {
        const [type, setType] = useState('all_complete');
        const [checklistName, setChecklistName] = useState('');
        const [status, setStatus] = useState('complete');

        const handleAdd = () => {
            let text = '';
            if (type === 'all_complete') text = 'with all checklists complete';
            else if (type === 'incomplete') text = 'with an incomplete checklist';
            else if (type === 'with_checklist') text = `with checklist "${checklistName}" ${status}`;
            else if (type === 'without_checklist') text = `without checklist "${checklistName}"`;
            else if (type === 'without_checklists') text = 'without checklists';

            onAdd({ type: 'checklist', subtype: type, checklistName, status, text });
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Select value={type} style={{ width: 220 }} onChange={setType}>
                        <Option value="all_complete">with all checklists complete</Option>
                        <Option value="incomplete">with an incomplete checklist</Option>
                        <Option value="with_checklist">with checklist</Option>
                        <Option value="without_checklist">without checklist</Option>
                        <Option value="without_checklists">without checklists</Option>
                    </Select>
                    {(type === 'with_checklist' || type === 'without_checklist') && (
                        <Input
                            placeholder="Checklist name"
                            value={checklistName}
                            onChange={e => setChecklistName(e.target.value)}
                            style={{ width: 120 }}
                        />
                    )}
                    {type === 'with_checklist' && (
                        <Select value={status} onChange={setStatus} style={{ width: 100 }}>
                            <Option value="complete">complete</Option>
                            <Option value="incomplete">incomplete</Option>
                        </Select>
                    )}
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <ChecklistRow />
        </Space>
    );
};
