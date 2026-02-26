'use client';

import React from 'react';
import { Button, Checkbox } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import EditableTitle from '@/components/common/EditableTitle';
import { useTranslation } from '@/hooks/useLabels';

interface CardHeaderProps {
    title: string;
    isCompleted?: boolean;
    onTitleSave: (newTitle: string) => Promise<void> | void;
    onCompletedChange?: (checked: boolean) => Promise<void> | void;
    onBack: () => void;
    hideBackButton?: boolean;
}

export default function CardHeader({
    title,
    isCompleted = false,
    onTitleSave,
    onCompletedChange,
    onBack,
    hideBackButton = false,
}: CardHeaderProps) {
    const t = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: hideBackButton ? '24px 24px 0 24px' : '5px 10px',
                // background: 'var(--bg-primary)',
            }}
        >
            {!hideBackButton && (
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    style={{ marginTop: 4 }}
                />
            )}
            <Checkbox
                checked={isCompleted}
                onChange={(e) => onCompletedChange?.(e.target.checked)}
                style={{ marginTop: 8 }}
            />
            <EditableTitle
                value={title}
                onSave={onTitleSave}
                placeholder={t('UI_PLACEHOLDER_CARD_TITLE')}
                strong
                style={{ flex: 1 }}
                textStyle={{ fontSize: 20 }}
                inputStyle={{ fontSize: 20, fontWeight: 600 }}
            />
        </div>
    );
}
