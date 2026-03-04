'use client';

import UserAvatar from '@/components/common/UserAvatar';
import { useTranslation } from '@/hooks/useLabels';
import type { DefaultReactSuggestionItem, SuggestionMenuProps } from '@blocknote/react';
import React from 'react';

// Extended type for mention suggestion items
export type MentionSuggestionItem = DefaultReactSuggestionItem & {
    userId: string;
    displayName: string;
    avatarUrl?: string;
};

// Custom suggestion menu that displays displayName instead of title
export function MentionSuggestionMenu(props: SuggestionMenuProps<MentionSuggestionItem>) {
    const { items, loadingState, selectedIndex, onItemClick } = props;
    const t = useTranslation();

    if (loadingState === 'loading-initial') {
        return (
            <div className="bn-suggestion-menu" style={menuStyle}>
                <div style={itemStyle}>{t('UI_LOADING')}</div>
            </div>
        );
    }

    if (items.length === 0 && loadingState === 'loaded') {
        return (
            <div className="bn-suggestion-menu" style={menuStyle}>
                <div style={emptyStyle}>{t('UI_NO_MEMBERS_FOUND')}</div>
            </div>
        );
    }

    return (
        <div className="bn-suggestion-menu" style={menuStyle}>
            {items.map((item, index) => (
                <div
                    key={item.title} // Using title (which contains id) as key
                    style={{
                        ...itemStyle,
                        ...(index === selectedIndex ? selectedStyle : {}),
                    }}
                    onClick={() => onItemClick?.(item)}
                    onMouseEnter={(e) => {
                        if (index !== selectedIndex) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, #f5f5f5)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (index !== selectedIndex) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <UserAvatar
                        avatarUrl={item.avatarUrl}
                        name={item.displayName}
                        size="small"
                    />
                    <span>{item.displayName}</span>
                </div>
            ))}
            {loadingState === 'loading' && (
                <div style={itemStyle}>{t('UI_LOADING_MORE')}</div>
            )}
        </div>
    );
}

const menuStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary, white)',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color, #e0e0e0)',
    padding: 4,
    maxHeight: 300,
    overflowY: 'auto',
    minWidth: 200,
};

const itemStyle: React.CSSProperties = {
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background-color 0.15s ease',
};

const selectedStyle: React.CSSProperties = {
    backgroundColor: 'var(--primary-color, #1890ff)',
    color: 'white',
};

const emptyStyle: React.CSSProperties = {
    padding: '8px 12px',
    color: 'var(--text-secondary, #888)',
    fontStyle: 'italic',
};

const iconStyle: React.CSSProperties = {
    color: 'var(--primary-color, #1890ff)',
    fontWeight: 600,
};
