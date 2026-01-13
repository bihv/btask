'use client';

import React from 'react';
import { Space, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Shared MenuItem component
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    extra?: React.ReactNode;
    danger?: boolean;
}

export function MenuItem({ icon, label, onClick, extra, danger }: MenuItemProps) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                cursor: onClick ? 'pointer' : 'default',
                borderRadius: 4,
                transition: 'background-color 0.15s',
                color: danger ? '#ff4d4f' : 'inherit',
            }}
            onMouseEnter={(e) => {
                if (onClick) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Space size={8}>
                <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', opacity: 0.8 }}>
                    {icon}
                </span>
                <Text style={{ color: danger ? '#ff4d4f' : 'inherit', fontSize: 14 }}>{label}</Text>
            </Space>
            {extra}
        </div>
    );
}

// Screen header with back button
interface ScreenHeaderProps {
    title: string;
    onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 4px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 8,
        }}>
            <Button
                type="text"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                style={{ marginRight: 8 }}
            />
            <Text strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>{title}</Text>
        </div>
    );
}

// Menu title header
interface MenuTitleProps {
    title: string;
}

export function MenuTitle({ title }: MenuTitleProps) {
    return (
        <div style={{ textAlign: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
            <Text strong>{title}</Text>
        </div>
    );
}
