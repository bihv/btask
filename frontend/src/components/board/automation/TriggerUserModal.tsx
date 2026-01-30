import React, { useState } from 'react';
import { Button, List, Space, Typography, Select, Modal } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface TriggerUserModalProps {
    value?: any;
    onChange: (val: any) => void;
    members: any[];
    hasValue?: boolean;
}

export const TriggerUserModal = ({ value, onChange, members, hasValue }: TriggerUserModalProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSelect = (type: string, userId?: string, text?: string) => {
        onChange({ type, userId, text });
        setIsModalOpen(false);
    };

    const content = (
        <div style={{ width: 300 }}>
            <List size="small">
                <List.Item className="clickable-item" onClick={() => handleSelect('anyone', undefined, 'by anyone')}>
                    <Text>by anyone (default)</Text>
                    <PlusOutlined />
                </List.Item>
                <List.Item className="clickable-item" onClick={() => handleSelect('me', undefined, 'by me')}>
                    <Text>by me</Text>
                    <PlusOutlined />
                </List.Item>
                <List.Item>
                    <Space>
                        <Text>by @</Text>
                        <Select
                            style={{ width: 200 }}
                            showSearch
                            placeholder="username"
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(val) => handleSelect('user', val, `by ${members.find(m => m.id === val)?.username || 'user'}`)}
                        >
                            {members?.map((m: any) => (
                                <Option key={m.id} value={m.id}>{m.username}</Option>
                            ))}
                        </Select>
                        <PlusOutlined />
                    </Space>
                </List.Item>
                <List.Item className="clickable-item" onClick={() => handleSelect('except_me', undefined, 'by anyone except me')}>
                    <Text>by anyone except me</Text>
                    <PlusOutlined />
                </List.Item>
                <List.Item>
                    <Space>
                        <Text>by anyone except @</Text>
                        <Select
                            style={{ width: 140 }}
                            showSearch
                            placeholder="username"
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(val) => handleSelect('except_user', val, `by anyone except ${members.find(m => m.id === val)?.username || 'user'}`)}
                        >
                            {members?.map((m: any) => (
                                <Option key={m.id} value={m.id}>{m.username}</Option>
                            ))}
                        </Select>
                        <PlusOutlined />
                    </Space>
                </List.Item>
            </List>
        </div>
    );

    return (
        <>
            <Button
                icon={<UserOutlined />}
                size="small"
                type={hasValue ? 'primary' : 'default'}
                onClick={() => setIsModalOpen(true)}
            />
            <Modal
                title="Select User"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={350}
                destroyOnClose={true}
            >
                {content}
            </Modal>
        </>
    );
};
