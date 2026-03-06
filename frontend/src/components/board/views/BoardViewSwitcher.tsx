'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import styles from './BoardViewSwitcher.module.css';

import { SegmentedControl } from '@mantine/core';
import { IconApps, IconCalendar, IconDashboard, IconTable } from '@tabler/icons-react';
export type BoardViewMode = 'board' | 'table' | 'calendar' | 'dashboard';

interface BoardViewSwitcherProps {
    value: BoardViewMode;
    onChange: (value: BoardViewMode) => void;
}

export default function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
    const t = useTranslation();
    const token = useAppToken();

    const viewOptions = [
        { value: 'board', icon: <IconApps size={16} />, label: t('UI_VIEW_BOARD') },
        { value: 'table', icon: <IconTable size={16} />, label: t('UI_VIEW_TABLE') },
        { value: 'calendar', icon: <IconCalendar size={16} />, label: t('UI_VIEW_CALENDAR') },
        { value: 'dashboard', icon: <IconDashboard size={16} />, label: t('UI_VIEW_DASHBOARD') },
    ];
    return (
        <SegmentedControl
            value={value}
            onChange={(val) => onChange(val as BoardViewMode)}
            data={viewOptions.map((opt) => ({
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
