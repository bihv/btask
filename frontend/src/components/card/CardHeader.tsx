'use client';

import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import EditableTitle from '@/components/common/EditableTitle';

interface CardHeaderProps {
    title: string;
    onTitleSave: (newTitle: string) => Promise<void> | void;
    onBack: () => void;
}

export default function CardHeader({
    title,
    onTitleSave,
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
            <EditableTitle
                value={title}
                onSave={onTitleSave}
                placeholder="Enter card title..."
                strong
                style={{ flex: 1 }}
                textStyle={{ fontSize: 20 }}
                inputStyle={{ fontSize: 20, fontWeight: 600 }}
            />
        </div>
    );
}
