'use client';

import { useState } from 'react';
import { Modal, List, Button, Typography, Space, Empty, Card, Tag, Layout, Menu, theme } from 'antd';
import { 
    ThunderboltOutlined, 
    PlusOutlined, 
    DeleteOutlined, 
    RightOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    AppstoreOutlined,
    RobotOutlined
} from '@ant-design/icons';
import { useBoardRules, useDeleteRule } from '@/hooks/useAutomation';
import RuleBuilder from './RuleBuilder';

const { Text, Title, Paragraph } = Typography;
const { Sider, Content } = Layout;

interface AutomationModalProps {
    open: boolean;
    onClose: () => void;
    boardId: string;
}

export default function AutomationModal({ open, onClose, boardId }: AutomationModalProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [selectedKey, setSelectedKey] = useState('rules');
    const { data: rules = [], isLoading } = useBoardRules(boardId);
    const deleteRule = useDeleteRule();

    const { token } = theme.useToken();

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Rule?',
            content: 'This action cannot be undone.',
            okType: 'danger',
            onOk: () => deleteRule.mutateAsync(id),
        });
    };

    const renderTriggerDescription = (rule: any) => {
        const config = rule.trigger_config;
        if (rule.trigger_type === 'event') {
            return <Tag color="blue">Event: {config.event}</Tag>;
        }
        return <Tag>{rule.trigger_type}</Tag>;
    };

    const renderSidebar = () => (
        <Sider width={250} theme="light" style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ padding: '16px 24px' }}>
                 <Title level={4} style={{ margin: 0 }}>Automation</Title>
            </div>
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                style={{ borderRight: 0 }}
                onClick={({ key }) => setSelectedKey(key)}
                items={[
                    { key: 'grp_auto', label: 'Automations', type: 'group', children: [
                        { key: 'rules', label: 'Rules', icon: <ThunderboltOutlined /> },
                        { key: 'scheduled', label: 'Scheduled', icon: <ClockCircleOutlined />, disabled: true },
                        { key: 'due_date', label: 'Due date', icon: <CalendarOutlined />, disabled: true },
                    ]},
                    { key: 'grp_btn', label: 'Custom buttons', type: 'group', children: [
                        { key: 'card_btn', label: 'Card buttons', icon: <AppstoreOutlined />, disabled: true },
                        { key: 'board_btn', label: 'Board buttons', icon: <AppstoreOutlined />, disabled: true },
                    ]},
                ]}
            />
        </Sider>
    );

    const renderRulesContent = () => (
        <Content style={{ padding: '24px', background: token.colorBgContainer }}>
            {/* Header Section */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={3} style={{ margin: 0 }}>Rules</Title>
                    <Button type="primary" onClick={() => setIsCreating(true)}>
                        Create automation
                    </Button>
                </div>
                
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <Title level={5} style={{ marginTop: 0 }}>
                            Rules are simple: when one thing happens, another thing happens automatically
                        </Title>
                        <Paragraph type="secondary">Examples:</Paragraph>
                        <ul style={{ color: token.colorTextSecondary, paddingLeft: 20 }}>
                            <li style={{ marginBottom: 8 }}>
                                When a <strong>card is created</strong> in list "To Do" by me, <strong>add the "Steps" checklist</strong>.
                            </li>
                            <li style={{ marginBottom: 8 }}>
                                When a <strong>card is moved</strong> to list "Done" by anyone, <strong>mark the due date as complete</strong>.
                            </li>
                            <li>
                                When I am <strong>added to a card</strong>, <strong>set the due date</strong> in 5 days.
                            </li>
                        </ul>
                    </div>
                    {/* Video Placeholder */}
                    <div style={{ 
                        width: 280, 
                        height: 160, 
                        background: token.colorFillSecondary,
                        borderRadius: token.borderRadius,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: token.colorText,
                        flexShrink: 0
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <RobotOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                            <div>How to create rules</div>
                        </div>
                    </div>
                </div>
            </div>

            <List
                header={<Text strong>Your Rules</Text>}
                loading={isLoading}
                dataSource={rules}
                locale={{ emptyText: <Text type="secondary">No rules yet. Create your first automation!</Text> }}
                renderItem={(rule: any) => (
                    <List.Item>
                        <Card style={{ width: '100%' }} size="small" hoverable>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space direction="vertical" size={2}>
                                    <Text strong style={{ fontSize: 16 }}>{rule.name}</Text>
                                    <Space>
                                        {renderTriggerDescription(rule)}
                                        <RightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                                        <Tag color="green">{rule.actions?.length || 0} Actions</Tag>
                                    </Space>
                                </Space>
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    type="text"
                                    onClick={() => handleDelete(rule.id)}
                                />
                            </div>
                        </Card>
                    </List.Item>
                )}
            />
        </Content>
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
            styles={{ body: { padding: 0, height: '650px', overflow: 'hidden' } }}
            closeIcon={null} // Custom close button if needed or default
        >
            <Layout style={{ height: '650px' }}>
                {renderSidebar()}
                <Content style={{ overflowY: 'auto', background: token.colorBgContainer }}>
                    <div style={{ position: 'absolute', right: 20, top: 20, zIndex: 10 }}>
                        <Button type="text" icon={<DeleteOutlined />} onClick={onClose} style={{ transform: 'rotate(45deg)' }} />
                    </div>
                    
                    {isCreating ? (
                         <Content style={{ padding: '24px' }}>
                             <Button onClick={() => setIsCreating(false)} style={{ marginBottom: 16 }}>
                                 Back to Rules
                             </Button>
                             <RuleBuilder boardId={boardId} onCancel={() => setIsCreating(false)} onSuccess={() => setIsCreating(false)} />
                         </Content>
                    ) : (
                        renderRulesContent()
                    )}
                </Content>
            </Layout>
        </Modal>
    );
}
