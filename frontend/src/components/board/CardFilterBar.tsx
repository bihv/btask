'use client';

import React from 'react';
import { Input, Select, Space, Button, Badge } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { Label, User } from '@/types';

const { Option } = Select;

export interface FilterState {
    search: string;
    labelIds: string[];
    memberIds: string[];
    dueDate: 'overdue' | 'due_soon' | 'no_date' | null;
}

interface CardFilterBarProps {
    labels: Label[];
    members: User[];
    filters: FilterState;
    onChange: (filters: FilterState) => void;
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

export default function CardFilterBar({
    labels,
    members,
    filters,
    onChange,
}: CardFilterBarProps) {
    const activeCount = [
        filters.search ? 1 : 0,
        filters.labelIds.length > 0 ? 1 : 0,
        filters.memberIds.length > 0 ? 1 : 0,
        filters.dueDate ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            flexWrap: 'wrap',
        }}>
            <Input.Search
                placeholder="Search cards..."
                value={filters.search}
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                style={{ width: 220 }}
                allowClear
            />

            <Select
                mode="multiple"
                placeholder="Labels"
                value={filters.labelIds}
                onChange={(labelIds) => onChange({ ...filters, labelIds })}
                style={{ minWidth: 120 }}
                allowClear
                maxTagCount={1}
            >
                {labels.map((label) => (
                    <Option key={label.id} value={label.id}>
                        <Space>
                            <div
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 2,
                                    backgroundColor: label.color,
                                }}
                            />
                            {label.name || 'Unnamed'}
                        </Space>
                    </Option>
                ))}
            </Select>

            <Select
                mode="multiple"
                placeholder="Members"
                value={filters.memberIds}
                onChange={(memberIds) => onChange({ ...filters, memberIds })}
                style={{ minWidth: 120 }}
                allowClear
                maxTagCount={1}
            >
                {members.map((member) => (
                    <Option key={member.id} value={member.id}>
                        {member.full_name || member.email}
                    </Option>
                ))}
            </Select>

            <Select
                placeholder="Due Date"
                value={filters.dueDate}
                onChange={(dueDate) => onChange({ ...filters, dueDate })}
                style={{ width: 120 }}
                allowClear
            >
                <Option value="overdue">Overdue</Option>
                <Option value="due_soon">Due Soon</Option>
                <Option value="no_date">No Date</Option>
            </Select>

            {activeCount > 0 && (
                <Button
                    type="text"
                    icon={<ClearOutlined />}
                    onClick={() => onChange(defaultFilters)}
                >
                    Clear ({activeCount})
                </Button>
            )}
        </div>
    );
}
