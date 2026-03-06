'use client';

import { useTranslation } from '@/hooks/useLabels';
import { BoardList, ChecklistItem } from '@/types';
import dayjs from 'dayjs';

import { Badge, Button, Group, Modal, Select, Text } from '@mantine/core';
import { IconCalendar, IconUser } from '@tabler/icons-react';
interface ConvertToCardModalProps {
    visible: boolean;
    item: ChecklistItem | null;
    lists: BoardList[];
    selectedListId: string;
    onListChange: (listId: string) => void;
    onConvert: () => void;
    onCancel: () => void;
}

export default function ConvertToCardModal({
    visible,
    item,
    lists,
    selectedListId,
    onListChange,
    onConvert,
    onCancel,
}: ConvertToCardModalProps) {
    const t = useTranslation();
    return (
        <Modal
            title={t('UI_CONVERT_TO_CARD_TITLE')}
            opened={visible}
            onClose={onCancel}
        >
            {item && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Text fw={700}>{t('UI_CONVERTING')} </Text>
                        <Text>{item.content}</Text>
                    </div>
                    {item.assignees && item.assignees.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <Text c="dimmed">{t('UI_ASSIGNEES_CARD_MEMBERS')} </Text>
                            {item.assignees.map(a => (
                                <Badge key={a.id} leftSection={<IconUser size={16} />}>{a.user?.full_name}</Badge>
                            ))}
                        </div>
                    )}
                    {item.due_date && (
                        <div style={{ marginBottom: 16 }}>
                            <Text c="dimmed">{t('UI_DUE_DATE_LABEL')}: </Text>
                            <Badge leftSection={<IconCalendar size={16} />}>{dayjs(item.due_date).format('MMM D, YYYY')}</Badge>
                        </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                        <Text fw={700}>{t('UI_SELECT_TARGET_LIST')}</Text>
                    </div>
                    <Select
                        value={selectedListId}
                        onChange={(val) => onListChange(val || '')}
                        style={{ width: '100%' }}
                        placeholder={t('UI_PLACEHOLDER_SELECT_LIST')}
                        data={lists.map(list => ({ value: list.id, label: list.title }))}
                    />
                    {lists.length === 0 && (
                        <Text c="dimmed" style={{ display: 'block', marginTop: 8 }}>
                            {t('UI_NO_LISTS_AVAILABLE')}
                        </Text>
                    )}
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onCancel}>
                            {t('UI_CANCEL')}
                        </Button>
                        <Button onClick={onConvert} disabled={!selectedListId}>
                            {t('UI_CONVERT')}
                        </Button>
                    </Group>
                </div>
            )}
        </Modal>
    );
}
