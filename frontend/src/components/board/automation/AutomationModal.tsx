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
                        <Title level={4}>Automation</Title>
                    </Flex>
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        style={{ borderRight: 0 }}
                        onClick={({ key }) => setSelectedKey(key)}
                        items={[
                            {
                                key: 'grp_auto', label: 'Automations', type: 'group', children: [
                                    { key: 'rules', label: 'Rules', icon: <ThunderboltOutlined /> },
                                    { key: 'scheduled', label: 'Scheduled', icon: <ClockCircleOutlined /> }, // Enabled
                                    { key: 'due_date', label: 'Due date', icon: <CalendarOutlined /> }, // Enabled
                                ]
                            },
                            {
                                key: 'grp_btn', label: 'Custom buttons', type: 'group', children: [
                                    { key: 'card_btn', label: 'Card buttons', icon: <AppstoreOutlined />, disabled: true },
                                    { key: 'board_btn', label: 'Board buttons', icon: <AppstoreOutlined />, disabled: true },
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
