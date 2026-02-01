import React, { useState, useEffect } from 'react';
import { Button, Modal, Space, Select, Input } from 'antd';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

interface TriggerTextMatchModalProps {
    value?: { condition: string; text: string };
    onChange: (val: { condition: string; text: string }) => void;
    hasValue?: boolean;
    customIcon?: React.ReactNode;
}

export const TriggerTextMatchModal = ({ value, onChange, hasValue, customIcon }: TriggerTextMatchModalProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [config, setConfig] = useState(value || { condition: 'starting_with', text: '' });
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isModalOpen && value) {
            setConfig(value);
        } else if (isModalOpen && !value) {
            setConfig({ condition: 'starting_with', text: '' });
        }
    }, [isModalOpen, value]);

    const handleSave = () => {
        if (config.text && config.text.trim() !== '') {
            onChange(config);
            setIsModalOpen(false);
            setError(false);
        } else {
            setError(true);
        }
    };

    return (
        <>
            <Button
                icon={customIcon || <span style={{ fontWeight: 600 }}>T</span>}
                size="small"
                type={hasValue ? 'primary' : 'default'}
                onClick={() => setIsModalOpen(true)}
            />
            <Modal
                title="Filter by Name"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={500}
                destroyOnClose={true}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Space style={{ flex: 1 }}>
                        <Select
                            value={config.condition}
                            style={{ width: 140 }}
                            onChange={(val) => setConfig({ ...config, condition: val })}
                        >
                            <Select.Option value="starting_with">starting with</Select.Option>
                            <Select.Option value="ending_with">ending with</Select.Option>
                            <Select.Option value="containing">containing</Select.Option>
                            <Select.Option value="not_starting_with">not starting with</Select.Option>
                            <Select.Option value="not_ending_with">not ending with</Select.Option>
                            <Select.Option value="not_containing">not containing</Select.Option>
                        </Select>
                        <Input
                            placeholder="text"
                            value={config.text}
                            status={error ? 'error' : ''}
                            onChange={(e) => {
                                setConfig({ ...config, text: e.target.value });
                                setError(false);
                            }}
                            style={{ width: 200 }}
                            onPressEnter={handleSave}
                        />
                    </Space>
                    <Button type="text" onClick={handleSave} icon={<PlusOutlined />} />
                </div>
            </Modal>
        </>
    );
};
