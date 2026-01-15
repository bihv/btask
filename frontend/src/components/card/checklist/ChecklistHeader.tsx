'use client';

import React from 'react';
import { Typography, Progress, Dropdown, Button } from 'antd';
import { CheckSquareOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChecklistHeaderProps {
    title: string;
    progress: number;
    onDelete: () => void;
}

export default function ChecklistHeader({
    title,
    progress,
    onDelete,
}: ChecklistHeaderProps) {
    return (
        <>
            {/* Checklist Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckSquareOutlined />
                <Text strong style={{ flex: 1 }}>{title}</Text>
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'delete',
                                label: 'Delete',
                                danger: true,
                                icon: <DeleteOutlined />,
                                onClick: onDelete,
                            },
                        ],
                    }}
                    trigger={['click']}
                >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, minWidth: 32 }}>
                    {progress}%
                </Text>
                <Progress
                    percent={progress}
                    showInfo={false}
                    size="small"
                    strokeColor={progress === 100 ? '#52c41a' : undefined}
                />
            </div>
        </>
    );
}
