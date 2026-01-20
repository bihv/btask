'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface DueDateTagProps {
    dueDate: string;
    isCompleted?: boolean;
    showIcon?: boolean;
    size?: 'small' | 'default';
}

// Helper functions
const isOverdue = (dueDate: string): boolean => {
    return dayjs(dueDate).isBefore(dayjs());
};

const isDueSoon = (dueDate: string): boolean => {
    const due = dayjs(dueDate);
    const now = dayjs();
    // Due soon = within the next 72 hours (not overdue)
    return due.isAfter(now) && due.isBefore(now.add(72, 'hour'));
};

const isDueLater = (dueDate: string): boolean => {
    const due = dayjs(dueDate);
    const now = dayjs();
    // Due later = more than 72 hours from now
    return due.isAfter(now.add(72, 'hour'));
};

const formatDueDate = (dueDate: string): string => {
    const due = dayjs(dueDate);
    const now = dayjs();
    
    if (due.isSame(now, 'day')) return `Today ${due.format('hh:mm A')}`;
    if (due.isSame(now.add(1, 'day'), 'day')) return `Tomorrow ${due.format('hh:mm A')}`;
    if (due.isSame(now.subtract(1, 'day'), 'day')) return `Yesterday ${due.format('hh:mm A')}`;
    
    return due.format('MMM D YYYY hh:mm A');
};

export default function DueDateTag({ 
    dueDate, 
    isCompleted = false, 
    showIcon = false,
    size = 'default',
}: DueDateTagProps) {
    const overdue = isOverdue(dueDate);
    const dueSoon = isDueSoon(dueDate);
    const dueLater = isDueLater(dueDate);
    
    // Determine color based on status
    const getColor = () => {
        if (isCompleted) return 'green';
        if (overdue) return 'red';
        if (dueSoon) return 'orange';
        if (dueLater) return 'blue';
        return 'default';
    };
    
    // Get status text for tooltip
    const getStatusText = () => {
        if (isCompleted) return 'Completed';
        if (overdue) return 'Overdue';
        if (dueSoon) return 'Due soon';
        if (dueLater) return 'Due later';
        return '';
    };
    
    const formattedDate = formatDueDate(dueDate);
    const statusText = getStatusText();
    const tooltipTitle = statusText ? `${formattedDate} • ${statusText}` : formattedDate;
    
    return (
        <Tooltip title={tooltipTitle}>
            <Tag 
                color={getColor()} 
                style={size === 'small' ? { fontSize: 10 } : undefined}
            >
                {showIcon && <ClockCircleOutlined style={{ marginRight: 4 }} />}
                {formattedDate}
            </Tag>
        </Tooltip>
    );
}

// Export helper functions for use elsewhere
export { isOverdue, isDueSoon, isDueLater, formatDueDate };
