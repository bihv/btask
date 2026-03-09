import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import { Label } from '@/types';
import { Button } from '@mantine/core';
import { IconCheck, IconEdit } from '@tabler/icons-react';
import React from 'react';

interface LabelListProps {
    labels: Label[];
    selectedLabelIds?: string[];
    onToggle?: (labelId: string) => void;
    onEditClick: (label: Label, e: React.MouseEvent) => void;
    onCreateClick: () => void;
}

export default function LabelList({
    labels,
    selectedLabelIds = [],
    onToggle,
    onEditClick,
    onCreateClick,
}: LabelListProps) {
    const t = useTranslation();
    const token = useAppToken();

    return (
        <React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {labels.length === 0 ? (
                    <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: 14 }}>{t('UI_NO_LABELS')}</span>
                    </div>
                ) : (
                    labels.map((label) => {
                        const isSelected = selectedLabelIds.includes(label.id);
                        
                        return (
                            <div
                                key={label.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {/* Label color bar  */}
                                <div
                                    onClick={() => onToggle?.(label.id)}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 4,
                                        backgroundColor: label.color,
                                        cursor: onToggle ? 'pointer' : 'default',
                                        color: token.colorWhite,
                                        minHeight: 32,
                                    }}
                                >
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{label.name || ''}</span>
                                    {onToggle && isSelected && <IconCheck size={16} />}
                                </div>
                                {/* Edit button */}
                                <Button
                                    variant="subtle"
                                    size="sm"
                                    onClick={(e) => onEditClick(label, e)}
                                    style={{
                                        color: 'var(--text-secondary)',
                                        width: 32,
                                        height: 32,
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                >
                                    <IconEdit size={16} />
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>
            <Button variant="default" fullWidth onClick={onCreateClick}>
                {t('UI_CREATE_NEW_LABEL')}
            </Button>
        </React.Fragment>
    );
}
