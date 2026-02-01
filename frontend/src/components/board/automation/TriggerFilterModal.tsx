import React, { useState, useMemo } from 'react';
import { Button, Tabs, Modal } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { BasicTab } from './trigger_tabs/BasicTab';
import { DatesTab } from './trigger_tabs/DatesTab';
import { ChecklistTab } from './trigger_tabs/ChecklistTab';
import { ContentTab } from './trigger_tabs/ContentTab';
import { FieldsTab } from './trigger_tabs/FieldsTab';

interface TriggerFilterModalProps {
    value?: any[];
    onChange: (val: any[]) => void;
    lists: any[];
    labels: any[];
    members: any[];
    showInactive?: boolean;
}

export const TriggerFilterModal = ({ value, onChange, lists, labels, members, showInactive = true }: TriggerFilterModalProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddFilter = (filter: any) => {
        const newFilters = [...(value || []), filter];
        onChange(newFilters);
        // Keep modal open to allow adding multiple or close? Usually keep open.
    };

    const tabs = useMemo(() => [
        {
            key: 'basic',
            label: 'Basic',
            children: <BasicTab lists={lists} labels={labels} members={members} showInactiveOption={showInactive} onAdd={handleAddFilter} />
        },
        {
            key: 'dates',
            label: 'Dates',
            children: <DatesTab onAdd={handleAddFilter} />
        },
        {
            key: 'checklists',
            label: 'Checklist',
            children: <ChecklistTab onAdd={handleAddFilter} />
        },
        {
            key: 'content',
            label: 'Content',
            children: <ContentTab onAdd={handleAddFilter} />
        },
        {
            key: 'fields',
            label: 'Fields',
            children: (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <FieldsTab customFields={lists /* mocking with lists for now or need prop */} onAdd={handleAddFilter} />
                </div>
            )
        }
    ], [lists, labels, members, value]); // value dependency because handleAddFilter uses it

    return (
        <>
            <Button
                icon={<FilterOutlined />}
                size="small"
                type={value && value.length > 0 ? 'primary' : 'default'}
                onClick={() => setIsModalOpen(true)}
            />
            <Modal
                title="Filter Triggers"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                destroyOnClose={false}
            >
                <Tabs items={tabs} />
            </Modal>
        </>
    );
};
