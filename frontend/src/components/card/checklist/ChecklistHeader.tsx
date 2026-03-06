'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';

import { Button, Menu, Progress, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconCheckbox, IconDots, IconTrash } from '@tabler/icons-react';
interface ChecklistHeaderProps {
    title: string;
    progress: number;
    onDelete: () => void;
}

export default function ChecklistHeader({
    title,
    progress,
    onDelete,
}: ChecklistHeaderProps) {
    const t = useTranslation();
    const token = useAppToken();
    return (
        <>
            {/* Checklist Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconCheckbox size={16} />
                <Text fw={700} style={{ flex: 1 }}>{title}</Text>
                <Menu
                    trigger="click"
                    position="bottom-end"
                >
                    <Menu.Target>
                        <Button variant="subtle" size="sm" leftSection={<IconDots size={16} />} />
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            onClick={() => {
                                modals.openConfirmModal({
                                    title: t('UI_CONFIRM_DELETE'),
                                    centered: true,
                                    children: (
                                        <Text size="sm">
                                            {t('UI_CONFIRM_DELETE_CHECKLIST_MSG')}
                                        </Text>
                                    ),
                                    labels: { confirm: t('UI_DELETE'), cancel: t('UI_CANCEL') },
                                    confirmProps: { color: 'red' },
                                    onConfirm: onDelete,
                                });
                            }}
                        >
                            {t('UI_DELETE')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text c="dimmed" style={{ fontSize: 11, minWidth: 32 }}>
                    {progress}%
                </Text>
                <Progress
                    style={{ flex: 1 }}
                    value={progress}
                    size="sm"
                    color={progress === 100 ? token.colorSuccess : undefined}
                />
            </div>
        </>
    );
}
