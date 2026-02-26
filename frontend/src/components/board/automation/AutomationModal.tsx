'use client';

import { useState } from 'react';
import { Modal, Layout, Menu, Button, Typography, theme, Flex } from 'antd';
import {
    ThunderboltOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    AppstoreOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import AutomationRules from './AutomationRules';
import AutomationScheduled from './AutomationScheduled';
import AutomationDueDate from './AutomationDueDate';
import { useTranslation } from '@/hooks/useLabels';

const { Title } = Typography;
const { Sider, Content } = Layout;

interface AutomationModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
}

export default function AutomationModal({ open, onClose, boardId }: AutomationModalProps) {
    const [selectedKey, setSelectedKey] = useState('rules');
    const { token } = theme.useToken();
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
            open={open}
            onCancel={onClose}
            footer={null}
            width={'90vw'}
        >
            <Layout style={{ height: '80vh', backgroundColor: 'transparent' }}>
                <Sider style={{ backgroundColor: 'transparent' }}>
                    <Flex style={{ padding: '16px 24px' }} align="center">
                        <Title level={4}>{t('UI_AUTOMATION')}</Title>
                    </Flex>
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        style={{ borderRight: 0 }}
                        onClick={({ key }) => setSelectedKey(key)}
                        items={[
                            {
                                key: 'grp_auto', label: t('UI_AUTOMATIONS'), type: 'group', children: [
                                    { key: 'rules', label: t('UI_RULES'), icon: <ThunderboltOutlined /> },
                                    { key: 'scheduled', label: t('UI_SCHEDULED'), icon: <ClockCircleOutlined /> },
                                    { key: 'due_date', label: t('UI_DUE_DATE_LABEL'), icon: <CalendarOutlined /> },
                                ]
                            },
                            {
                                key: 'grp_btn', label: t('UI_CUSTOM_BUTTONS'), type: 'group', children: [
                                    { key: 'card_btn', label: t('UI_CARD_BUTTONS'), icon: <AppstoreOutlined />, disabled: true },
                                    { key: 'board_btn', label: t('UI_BOARD_BUTTONS'), icon: <AppstoreOutlined />, disabled: true },
                                ]
                            },
                        ]}
                    />
                </Sider>
                <Content style={{ overflow: 'auto', height: '100%' }}>
                    {renderContent()}
                </Content>
            </Layout>
        </Modal>
    );
}
