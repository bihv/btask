'use client';

import React from 'react';
import { Typography, Modal, Select, Tag } from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { ChecklistItem, List } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ConvertToCardModalProps {
    visible: boolean;
    item: ChecklistItem | null;
    lists: List[];
    selectedListId: string;
    onListChange: (listId: string) => void;
    onConvert: () => void;
    onCancel: () => void;
}

export default function ConvertToCardModal({
    visible,
    item,
    lists,
    selectedListId,
    onListChange,
    onConvert,
    onCancel,
}: ConvertToCardModalProps) {
    return (
        <Modal
            title="Convert to Card"
            open={visible}
            onOk={onConvert}
            onCancel={onCancel}
            okText="Convert"
            okButtonProps={{ disabled: !selectedListId }}
        >
            {item && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Converting: </Text>
                        <Text>{item.content}</Text>
                    </div>
                    {item.assignees && item.assignees.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <Text type="secondary">Assignees will be added as card members: </Text>
                            {item.assignees.map(a => (
                                <Tag key={a.id} icon={<UserOutlined />}>{a.user?.full_name}</Tag>
                            ))}
                        </div>
                    )}
                    {item.due_date && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">Due date: </Text>
                            <Tag icon={<CalendarOutlined />}>{dayjs(item.due_date).format('MMM D, YYYY')}</Tag>
                        </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                        <Text strong>Select target list:</Text>
                    </div>
                    <Select
                        value={selectedListId}
                        onChange={onListChange}
                        style={{ width: '100%' }}
                        placeholder="Select a list"
                    >
                        {lists.map(list => (
                            <Select.Option key={list.id} value={list.id}>
                                {list.title}
                            </Select.Option>
                        ))}
                    </Select>
                    {lists.length === 0 && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            No lists available. Please create a list first.
                        </Text>
                    )}
                </div>
            )}
        </Modal>
    );
}
