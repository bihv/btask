'use client';

import React from 'react';

import { Text, Title, Button } from '@mantine/core';
interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export default function SectionHeader({ title, icon, actionLabel, onAction }: SectionHeaderProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon}
                <Title order={4} style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {title}
                </Title>
            </div>
            {actionLabel && (
                <Button variant="default" size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
