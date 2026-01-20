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

export type BoardViewMode = 'board' | 'table' | 'calendar' | 'dashboard';

interface BoardViewSwitcherProps {
    value: BoardViewMode;
    onChange: (value: BoardViewMode) => void;
}

const viewOptions = [
    { value: 'board', icon: <AppstoreOutlined />, label: 'Board' },
    { value: 'table', icon: <TableOutlined />, label: 'Table' },
    { value: 'calendar', icon: <CalendarOutlined />, label: 'Calendar' },
    { value: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
];

export default function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
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
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(8px)',
            }}
        />
    );
}
