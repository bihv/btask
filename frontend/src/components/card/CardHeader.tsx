'use client';

import React from 'react';
import { Input, Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CardHeaderProps {
    title: string;
    isEditing: boolean;
    onTitleChange: (value: string) => void;
    onTitleSave: () => void;
    onEditStart: () => void;
    onBack: () => void;
}

export default function CardHeader({
    title,
    isEditing,
    onTitleChange,
    onTitleSave,
    onEditStart,
    onBack,
}: CardHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                background: 'var(--bg-primary)',
            }}
        >
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
            />
            {isEditing ? (
                <Input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    onBlur={onTitleSave}
                    onPressEnter={onTitleSave}
                    autoFocus
                    style={{
                        flex: 1,
                        fontSize: 20,
                        fontWeight: 600,
                        padding: '4px 8px',
                    }}
                />
            ) : (
                <Title
                    level={4}
                    style={{ margin: 0, flex: 1, cursor: 'pointer' }}
                    ellipsis
                    onClick={onEditStart}
                >
                    {title}
                </Title>
            )}
        </div>
    );
}
