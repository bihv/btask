import React, { useState } from 'react';
import { Space, Select, Button, Typography, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rowStyle } from './styles';

const { Option } = Select;
const { Text } = Typography;

interface BasicTabProps {
    lists: any[];
    labels: any[];
    members: any[];
    showInactiveOption?: boolean;
    onAdd: (filter: any) => void;
}

export const BasicTab = ({ lists, labels, members, showInactiveOption = true, onAdd }: BasicTabProps) => {

    const LabelRow = ({ labels, onAdd }: { labels: any[]; onAdd: (filter: any) => void }) => {
        const [operator, setOperator] = useState('with');
        const [selectedLabelId, setSelectedLabelId] = useState<string | undefined>(undefined);
        const [error, setError] = useState(false);

        const handleAdd = () => {
            if (operator === 'without_any') {
                onAdd({ type: 'label', subtype: operator, text: 'without any label' });
                setError(false);
            } else if (selectedLabelId) {
                const labelName = labels?.find((l: any) => l.id === selectedLabelId)?.name || 'label';
                const text = `${operator === 'with' ? 'with' : 'without'} label "${labelName}"`;
                onAdd({ type: 'label', subtype: operator, value: selectedLabelId, text });
                setError(false);
            } else {
                setError(true);
            }
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Select value={operator} style={{ width: 120 }} onChange={setOperator}>
                        <Option value="with">with</Option>
                        <Option value="without">without</Option>
                        <Option value="without_any">without any</Option>
                    </Select>
                    <Text>label</Text>
                    {operator !== 'without_any' && (
                        <Select
                            style={{ width: 180 }}
                            placeholder="Select label"
                            value={selectedLabelId}
                            status={error ? 'error' : ''}
                            onChange={(val) => {
                                setSelectedLabelId(val);
                                setError(false);
                            }}
                        >
                            {labels?.map((l: any) => <Option key={l.id} value={l.id}>{l.name}</Option>)}
                        </Select>
                    )}
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    const MemberRow = ({ members, onAdd }: { members: any[]; onAdd: (filter: any) => void }) => {
        const [operator, setOperator] = useState('assigned');
        const [memberType, setMemberType] = useState('member');
        const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
        const [error, setError] = useState(false);

        const handleAdd = () => {
            let text = '';
            let filterValue = memberType;

            if (memberType === 'member') {
                if (selectedMemberId) {
                    const memberName = members?.find((m: any) => m.id === selectedMemberId)?.username || 'member';
                    text = `${operator.replace('_', ' ')} ${memberName}`;
                    filterValue = selectedMemberId;
                    onAdd({ type: 'member', subtype: operator, value: filterValue, text });
                    setError(false);
                } else {
                    setError(true);
                }
            } else {
                text = `${operator.replace('_', ' ')} ${memberType}`;
                onAdd({ type: 'member', subtype: operator, value: filterValue, text });
                setError(false);
            }
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Select value={operator} style={{ width: 120 }} onChange={setOperator}>
                        <Option value="assigned">assigned to</Option>
                        <Option value="assigned_only">assign only to</Option>
                        <Option value="not_assigned">not assigned to</Option>
                    </Select>
                    <Select
                        style={{ width: 130 }}
                        value={memberType}
                        onChange={(val) => {
                            setMemberType(val);
                            setError(false);
                        }}
                    >
                        <Option value="me">me</Option>
                        <Option value="anyone">anyone</Option>
                        <Option value="member">member</Option>
                    </Select>
                    {memberType === 'member' && (
                        <Select
                            style={{ width: 180 }}
                            showSearch={{
                                filterOption: (input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }}
                            placeholder="Select member"
                            value={selectedMemberId}
                            status={error ? 'error' : ''}
                            onChange={(val) => {
                                setSelectedMemberId(val);
                                setError(false);
                            }}
                        >
                            {members?.map((m: any) => (
                                <Option key={m.id} value={m.id}>{m.username}</Option>
                            ))}
                        </Select>
                    )}
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    const ListRow = ({ lists, onAdd }: { lists: any[]; onAdd: (filter: any) => void }) => {
        const [operator, setOperator] = useState('in');
        const [listId, setListId] = useState<string | undefined>(undefined);
        const [error, setError] = useState(false);

        const handleAdd = () => {
            if (listId) {
                const listName = lists?.find((l: any) => l.id === listId)?.title || 'list';
                const text = `${operator.replace('_', ' ')} list "${listName}"`;
                onAdd({ type: 'list', subtype: operator, value: listId, text });
                setError(false);
            } else {
                setError(true);
            }
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Select value={operator} style={{ width: 80 }} onChange={setOperator}>
                        <Option value="in">in</Option>
                        <Option value="not_in">not in</Option>
                    </Select>
                    <Text>list</Text>
                    <Select
                        style={{ width: 180 }}
                        placeholder="Select list"
                        value={listId}
                        status={error ? 'error' : ''}
                        onChange={(val) => {
                            setListId(val);
                            setError(false);
                        }}
                    >
                        {lists?.map((l: any) => <Option key={l.id} value={l.id}>{l.title}</Option>)}
                    </Select>
                </Space>
                <Button icon={<PlusOutlined />} type="text" onClick={handleAdd} />
            </div>
        );
    };

    const InactiveRow = ({ onAdd }: { onAdd: (filter: any) => void }) => {
        const [amount, setAmount] = useState('1');
        const [unit, setUnit] = useState('days');
        const [error, setError] = useState(false);

        const handleAdd = () => {
            if (amount && amount.trim() !== '') {
                const text = `inactive for more than ${amount} ${unit.replace('_', ' ')}`;
                onAdd({ type: 'inactive', subtype: 'more_than', amount, unit, text });
                setError(false);
            } else {
                setError(true);
            }
        };

        return (
            <div style={rowStyle}>
                <Space wrap>
                    <Text>inactive for more than</Text>
                    <Input
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setError(false);
                        }}
                        style={{ width: 60 }}
                        status={error ? 'error' : ''}
                    />
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
            {/* List Row */}
            <ListRow lists={lists} onAdd={onAdd} />

            <LabelRow labels={labels} onAdd={onAdd} />
            <MemberRow members={members} onAdd={onAdd} />
            {showInactiveOption && <InactiveRow onAdd={onAdd} />}
        </Space>
    );
};
