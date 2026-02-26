'use client';

import React from 'react';
import { Typography, Modal, Select, Tag } from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { ChecklistItem, BoardList } from '@/types';
import dayjs from 'dayjs';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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
            open={visible}
            onOk={onConvert}
            onCancel={onCancel}
            okText={t('UI_CONVERT')}
            okButtonProps={{ disabled: !selectedListId }}
        >
            {item && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('UI_CONVERTING')} </Text>
                        <Text>{item.content}</Text>
                    </div>
                    {item.assignees && item.assignees.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <Text type="secondary">{t('UI_ASSIGNEES_CARD_MEMBERS')} </Text>
                            {item.assignees.map(a => (
                                <Tag key={a.id} icon={<UserOutlined />}>{a.user?.full_name}</Tag>
                            ))}
                        </div>
                    )}
                    {item.due_date && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">{t('UI_DUE_DATE_LABEL')}: </Text>
                            <Tag icon={<CalendarOutlined />}>{dayjs(item.due_date).format('MMM D, YYYY')}</Tag>
                        </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                        <Text strong>{t('UI_SELECT_TARGET_LIST')}</Text>
                    </div>
                    <Select
                        value={selectedListId}
                        onChange={onListChange}
                        style={{ width: '100%' }}
                        placeholder={t('UI_PLACEHOLDER_SELECT_LIST')}
                    >
                        {lists.map(list => (
                            <Select.Option key={list.id} value={list.id}>
                                {list.title}
                            </Select.Option>
                        ))}
                    </Select>
                    {lists.length === 0 && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            {t('UI_NO_LISTS_AVAILABLE')}
                        </Text>
                    )}
                </div>
            )}
        </Modal>
    );
}
