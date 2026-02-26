'use client';

import React from 'react';
import { Segmented } from 'antd';
import {
    AppstoreOutlined,
    TableOutlined,
    CalendarOutlined,
    DashboardOutlined,
} from '@ant-design/icons';
import styles from './BoardViewSwitcher.module.css';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

export type BoardViewMode = 'board' | 'table' | 'calendar' | 'dashboard';

interface BoardViewSwitcherProps {
    value: BoardViewMode;
    onChange: (value: BoardViewMode) => void;
}

export default function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
    const t = useTranslation();
    const token = useAppToken();

    const viewOptions = [
        { value: 'board', icon: <AppstoreOutlined />, label: t('UI_VIEW_BOARD') },
        { value: 'table', icon: <TableOutlined />, label: t('UI_VIEW_TABLE') },
        { value: 'calendar', icon: <CalendarOutlined />, label: t('UI_VIEW_CALENDAR') },
        { value: 'dashboard', icon: <DashboardOutlined />, label: t('UI_VIEW_DASHBOARD') },
    ];
    return (
        <Segmented
            value={value}
            onChange={(val) => onChange(val as BoardViewMode)}
            options={viewOptions.map((opt) => ({
                value: opt.value,
                label: (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0 4px',
                        color: 'inherit',
                    }}>
                        {opt.icon}
                        <span>{opt.label}</span>
                    </div>
                ),
            }))}
            className={styles.switcher}
            style={{
                background: token.colorOverlayDark,
                backdropFilter: 'blur(8px)',
            }}
        />
    );
}
