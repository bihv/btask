'use client';

import React, { useState } from 'react';
import { linkPreviewApi } from '@/lib/api';
import EditableTitle from '@/components/common/EditableTitle';
import styles from './LinkPreviewCard.module.css';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLink, IconRefresh } from '@tabler/icons-react';
interface LinkPreviewCardProps {
    cardId: string;
    cardTitle?: string; // The actual card title (URL)
    linkUrl: string;
    linkTitle?: string;
    linkDescription?: string;
    linkImage?: string;
    linkFavicon?: string;
    linkSiteName?: string;
    showCardCovers?: boolean;
    onExternalClick?: (e: React.MouseEvent) => void;
    onRefresh?: () => Promise<void>; // Callback to refresh board after update
    onUrlSave?: (newUrl: string) => Promise<void>; // Callback to save URL
    readOnly?: boolean;
}

export default function LinkPreviewCard({
    cardId,
    cardTitle,
    linkUrl,
    linkTitle,
    linkDescription,
    linkImage,
    linkFavicon,
    linkSiteName,
    showCardCovers = true,
    onExternalClick,
    onRefresh,
    onUrlSave,
    readOnly = false,
}: LinkPreviewCardProps) {
    const t = useTranslation();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const hostname = linkUrl ? new URL(linkUrl).hostname : '';

    const handleRefreshClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRefreshing(true);
        try {
            await linkPreviewApi.refresh(cardId);
            // Callback to refresh the board
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.response?.data?.message || t('ERROR_REFRESH_LINK'), color: 'red' });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <>
            {/* Link Preview Image */}
            {showCardCovers && linkImage && (
                <div
                    style={{
                        height: 140,
                        marginBottom: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                        marginTop: -8,
                        marginLeft: -8,
                        marginRight: -8,
                        width: 'calc(100% + 16px)',
                        backgroundColor: 'var(--bg-tertiary)',
                    }}
                >
                    <img
                        src={linkImage}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
            )}

            {/* Link Title */}
            <div style={{ marginBottom: 4 }}>
                <Text
                    fw={700}
                    style={{
                        fontSize: 14,
                        color: 'var(--link-color, #1890ff)',
                        display: 'block',
                    }}
                >
                    {linkTitle}
                </Text>
            </div>

            {/* URL (editable) */}
            {onUrlSave && cardTitle && (
                <div style={{ marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
                    <EditableTitle
                        value={cardTitle}
                        onSave={onUrlSave}
                        disabled={readOnly}
                        textStyle={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            display: 'block',
                            wordBreak: 'break-all',
                        }}
                        inputStyle={{ fontSize: 11 }}
                        size="sm"
                        placeholder={t('UI_PLACEHOLDER_ENTER_URL')}
                    />
                </div>
            )}

            {/* Link Description */}
            {linkDescription && (
                <Text c="dimmed"
                    style={{
                        fontSize: 12,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4',
                    }}
                >
                    {linkDescription}
                </Text>
            )}

            {/* Site Info & External Link */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-color)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {linkFavicon && (
                        <img
                            src={linkFavicon}
                            alt=""
                            style={{ width: 16, height: 16, borderRadius: 2 }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}
                    <Text c="dimmed" style={{ fontSize: 12 }}>
                        {linkSiteName || hostname}
                    </Text>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip label={t('UI_REFRESH_LINK_PREVIEW')}>
                        <div
                            onClick={handleRefreshClick}
                            style={{
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                padding: 4,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isRefreshing ? 0.5 : 1,
                            }}
                            className={styles.externalLinkButton}
                        >
                            <IconRefresh size={14} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                        </div>
                    </Tooltip>
                    {onExternalClick && (
                        <Tooltip label={t('UI_OPEN_LINK_NEW_TAB')}>
                            <div
                                onClick={onExternalClick}
                                style={{
                                    cursor: 'pointer',
                                    padding: 4,
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                className={styles.externalLinkButton}
                            >
                                <IconLink size={14} />
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
        </>
    );
}
