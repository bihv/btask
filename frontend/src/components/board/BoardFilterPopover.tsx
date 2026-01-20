import React from 'react';
import { Popover, Input, Button, Checkbox, Avatar, Badge, Space, Divider, Typography } from 'antd';
import { FilterOutlined, SearchOutlined, UserOutlined, ClockCircleOutlined, TagOutlined } from '@ant-design/icons';
import { Label, User } from '@/types';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface FilterState {
    search: string;
    labelIds: string[];
    memberIds: string[];
    dueDate: 'overdue' | 'due_soon' | 'due_later' | 'no_date' | null;
}

export const defaultFilters: FilterState = {
    search: '',
    labelIds: [],
    memberIds: [],
    dueDate: null,
};

export function hasActiveFilters(filters: FilterState): boolean {
    return (
        filters.search !== '' ||
        filters.labelIds.length > 0 ||
        filters.memberIds.length > 0 ||
        filters.dueDate !== null
    );
}

interface BoardFilterPopoverProps {
    labels: Label[];
    members: User[];
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    hideNoDateOption?: boolean;
    children: React.ReactNode;
}

export default function BoardFilterPopover({
    labels,
    members,
    filters,
    onChange,
    hideNoDateOption,
    children,
}: BoardFilterPopoverProps) {
    const activeCount = [
        filters.search ? 1 : 0,
        filters.labelIds.length > 0 ? 1 : 0,
        filters.memberIds.length > 0 ? 1 : 0,
        filters.dueDate ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const handleLabelToggle = (labelId: string) => {
        const newLabelIds = filters.labelIds.includes(labelId)
            ? filters.labelIds.filter((id) => id !== labelId)
            : [...filters.labelIds, labelId];
        onChange({ ...filters, labelIds: newLabelIds });
    };

    const handleMemberToggle = (memberId: string) => {
        const newMemberIds = filters.memberIds.includes(memberId)
            ? filters.memberIds.filter((id) => id !== memberId)
            : [...filters.memberIds, memberId];
        onChange({ ...filters, memberIds: newMemberIds });
    };

    const handleDueDateToggle = (option: FilterState['dueDate']) => {
        const newValue = filters.dueDate === option ? null : option;
        onChange({ ...filters, dueDate: newValue });
    };

    const content = (
        <div style={{ width: 300, maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14 }}>Filter Cards</Text>
                    {activeCount > 0 && (
                        <Button 
                            size="small" 
                            type="link" 
                            danger 
                            onClick={() => onChange(defaultFilters)}
                            style={{ padding: 0 }}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>KEYWORDS</Text>
                    <Input
                        placeholder="Search cards..."
                        prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}
                        allowClear
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>MEMBERS</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div 
                             style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                             onClick={() => onChange({ ...filters, memberIds: [] })}
                        >
                             <Checkbox checked={filters.memberIds.length === 0} />
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar size="small" icon={<UserOutlined />} />
                                <Text>No members</Text>
                             </div>
                        </div>
                        {members.map(member => (
                            <div 
                                key={member.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleMemberToggle(member.id)}
                            >
                                <Checkbox checked={filters.memberIds.includes(member.id)} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {member.avatar_url ? (
                                        <Avatar size="small" src={member.avatar_url} />
                                    ) : (
                                        <Avatar size="small" style={{ backgroundColor: '#0079bf' }}>{member.full_name?.[0] || member.email[0]}</Avatar>
                                    )}
                                    <Text>{member.full_name || member.email}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>LABELS</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                         <div 
                             style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                             onClick={() => onChange({ ...filters, labelIds: [] })}
                        >
                             <Checkbox checked={filters.labelIds.length === 0} />
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TagOutlined />
                                <Text>No labels</Text>
                             </div>
                        </div>
                        {labels.map(label => (
                            <div 
                                key={label.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleLabelToggle(label.id)}
                            >
                                <Checkbox checked={filters.labelIds.includes(label.id)} />
                                <div style={{ 
                                    width: '100%', 
                                    height: 32, 
                                    backgroundColor: label.color, 
                                    borderRadius: 4, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    paddingLeft: 12 
                                }}>
                                    <Text style={{ color: '#fff', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                                        {label.name}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>DUE DATE</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                         <div 
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleDueDateToggle(null)}
                            >
                                <Checkbox checked={filters.dueDate === null} />
                                <Text>No filter</Text>
                        </div>
                         <div 
                                key="overdue"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleDueDateToggle('overdue')}
                            >
                                <Checkbox checked={filters.dueDate === 'overdue'} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ClockCircleOutlined style={{ color: '#eb5a46' }} />
                                    <Text>Overdue</Text>
                                </div>
                        </div>
                         <div 
                                key="due_soon"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleDueDateToggle('due_soon')}
                            >
                                <Checkbox checked={filters.dueDate === 'due_soon'} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ClockCircleOutlined style={{ color: '#f2d600' }} />
                                    <Text>Due soon</Text>
                                </div>
                        </div>
                        <div
                            key="due_later"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                            onClick={() => handleDueDateToggle('due_later')}
                        >
                            <Checkbox checked={filters.dueDate === 'due_later'} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ClockCircleOutlined style={{ color: '#5ba4cf' }} />
                                <Text>Due Later</Text>
                            </div>
                        </div>
                        {!hideNoDateOption && (
                            <div
                                key="no_date"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
                                onClick={() => handleDueDateToggle('no_date')}
                            >
                                <Checkbox checked={filters.dueDate === 'no_date'} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, border: '2px dashed #999', borderRadius: '50%' }} />
                                    <Text>No due date</Text>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            placement="bottomRight"
            styles={{ content: { padding: 16 } }}
        >
            {children}
        </Popover>
    );
}
