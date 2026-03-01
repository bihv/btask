'use client';

import React from 'react';
import styles from './MenuShared.module.css';

import { Group, Text, Title, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
// Shared MenuItem component
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    extra?: React.ReactNode;
    danger?: boolean;
}

export function MenuItem({ icon, label, onClick, extra, danger }: MenuItemProps) {
    const className = [
        styles.menuItem,
        !onClick && styles.menuItemDisabled,
        danger && styles.menuItemDanger,
    ].filter(Boolean).join(' ');

    return (
        <div onClick={onClick} className={className}>
            <Group gap={8}>
                <span className={styles.menuItemIcon}>
                    {icon}
                </span>
                <Text className={danger ? styles.menuItemTextDanger : styles.menuItemText}>
                    {label}
                </Text>
            </Group>
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
                variant="subtle"
                size="sm"
                leftSection={<IconArrowLeft size={16}  />}
                onClick={onBack}
                style={{ marginRight: 8 }}
            />
            <Text fw={700} style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>{title}</Text>
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
            <Text fw={700}>{title}</Text>
        </div>
    );
}
