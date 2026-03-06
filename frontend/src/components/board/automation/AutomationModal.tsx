'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useState } from 'react';
import AutomationDueDate from './AutomationDueDate';
import AutomationRules from './AutomationRules';
import AutomationScheduled from './AutomationScheduled';

import { Flex, Modal, NavLink, Text, Title } from '@mantine/core';
import { IconApps, IconBolt, IconCalendar, IconClock } from '@tabler/icons-react';

interface AutomationModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
}

export default function AutomationModal({ open, onClose, boardId }: AutomationModalProps) {
    const [selectedKey, setSelectedKey] = useState('rules');
    const t = useTranslation();

    const renderContent = () => {
        switch (selectedKey) {
            case 'rules':
                return <AutomationRules boardId={boardId} />;
            case 'scheduled':
                return <AutomationScheduled />;
            case 'due_date':
                return <AutomationDueDate />;
            default:
                return <AutomationRules boardId={boardId} />;
        }
    };

    return (
        <Modal
            opened={open}
            onClose={onClose}
            size="90vw"
        >
            <div style={{ display: 'flex', height: '80vh' }}>
                {/* Sidebar */}
                <div style={{ width: 240, borderRight: '1px solid var(--mantine-color-default-border)', paddingRight: 16 }}>
                    <Flex style={{ padding: '16px 0' }} align="center">
                        <Title order={4}>{t('UI_AUTOMATION')}</Title>
                    </Flex>

                    <Text size="xs" fw={600} c="dimmed" mb="xs">{t('UI_AUTOMATIONS')}</Text>
                    <NavLink
                        label={t('UI_RULES')}
                        leftSection={<IconBolt size={16} />}
                        active={selectedKey === 'rules'}
                        onClick={() => setSelectedKey('rules')}
                    />
                    <NavLink
                        label={t('UI_SCHEDULED')}
                        leftSection={<IconClock size={16} />}
                        active={selectedKey === 'scheduled'}
                        onClick={() => setSelectedKey('scheduled')}
                    />
                    <NavLink
                        label={t('UI_DUE_DATE_LABEL')}
                        leftSection={<IconCalendar size={16} />}
                        active={selectedKey === 'due_date'}
                        onClick={() => setSelectedKey('due_date')}
                    />

                    <Text size="xs" fw={600} c="dimmed" mt="md" mb="xs">{t('UI_CUSTOM_BUTTONS')}</Text>
                    <NavLink
                        label={t('UI_CARD_BUTTONS')}
                        leftSection={<IconApps size={16} />}
                        disabled
                    />
                    <NavLink
                        label={t('UI_BOARD_BUTTONS')}
                        leftSection={<IconApps size={16} />}
                        disabled
                    />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', paddingLeft: 16 }}>
                    {renderContent()}
                </div>
            </div>
        </Modal>
    );
}
