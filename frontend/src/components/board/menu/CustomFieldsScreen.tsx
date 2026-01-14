'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Spin, message, Divider } from 'antd';
import {
    CheckCircleOutlined,
    FlagOutlined,
    ThunderboltOutlined,
    WarningOutlined,
    RightOutlined,
    PlusOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { CustomField } from '@/types';
import { customFieldApi } from '@/lib/api';
import { ScreenHeader } from './MenuShared';

const { Text } = Typography;

// Icons for different field types
const getFieldIcon = (type: string, name?: string) => {
    // For default fields, use specific icons
    const nameLower = name?.toLowerCase() || '';
    if (nameLower === 'priority') return <ThunderboltOutlined />;
    if (nameLower === 'status') return <FlagOutlined />;
    if (nameLower === 'risk') return <WarningOutlined />;
    if (nameLower === 'effort') return <ThunderboltOutlined style={{ transform: 'scaleX(-1)' }} />;

    // For custom fields, use icons based on type
    switch (type) {
        case 'checkbox':
            return <CheckCircleOutlined />;
        case 'dropdown':
            return <FlagOutlined />;
        default:
            return <CheckCircleOutlined />;
    }
};

interface SuggestedField {
    key: string;
    name: string;
    icon: React.ReactNode;
}

const suggestedFields: SuggestedField[] = [
    { key: 'priority', name: 'Priority', icon: <ThunderboltOutlined /> },
    { key: 'status', name: 'Status', icon: <FlagOutlined /> },
    { key: 'risk', name: 'Risk', icon: <WarningOutlined /> },
    { key: 'effort', name: 'Effort', icon: <ThunderboltOutlined style={{ transform: 'scaleX(-1)' }} /> },
];

interface CustomFieldsScreenProps {
    boardId: string;
    onBack: () => void;
    onNewField: () => void;
    onEditField: (field: CustomField) => void;
}

export default function CustomFieldsScreen({ boardId, onBack, onNewField, onEditField }: CustomFieldsScreenProps) {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingDefault, setAddingDefault] = useState<string | null>(null);

    const loadFields = async () => {
        try {
            const response = await customFieldApi.getByBoardId(boardId);
            setFields(response.data.data || []);
        } catch (error) {
            console.error('Failed to load custom fields:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFields();
    }, [boardId]);

    const handleAddDefaultField = async (fieldKey: string) => {
        setAddingDefault(fieldKey);
        try {
            await customFieldApi.addDefaultField(boardId, fieldKey);
            message.success('Field added successfully');
            loadFields();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to add field');
        } finally {
            setAddingDefault(null);
        }
    };

    // Filter out suggested fields that already exist
    const existingFieldNames = fields.map(f => f.name.toLowerCase());
    const availableSuggestedFields = suggestedFields.filter(
        sf => !existingFieldNames.includes(sf.name.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ width: 280, padding: 40, textAlign: 'center' }}>
                <Spin />
            </div>
        );
    }

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title="Custom Fields" onBack={onBack} />

            {/* Info button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 12px 8px' }}>
                <Button type="text" size="small" icon={<InfoCircleOutlined />} style={{ color: 'var(--text-secondary)' }}>
                    About custom fields
                </Button>
            </div>

            {/* Existing custom fields */}
            {fields.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            onClick={() => onEditField(field)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: 4,
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ opacity: 0.7 }}>
                                    {getFieldIcon(field.type, field.name)}
                                </span>
                                <Text>{field.name}</Text>
                            </div>
                            <RightOutlined style={{ fontSize: 12, opacity: 0.5 }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Suggested fields section */}
            {availableSuggestedFields.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '8px 12px' }}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Suggested Fields
                        </Text>
                    </div>
                    {availableSuggestedFields.map((sf) => (
                        <div
                            key={sf.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ opacity: 0.7 }}>{sf.icon}</span>
                                <Text>{sf.name}</Text>
                            </div>
                            <Button
                                size="small"
                                loading={addingDefault === sf.key}
                                onClick={() => handleAddDefaultField(sf.key)}
                            >
                                Add
                            </Button>
                        </div>
                    ))}
                </>
            )}

            {/* New field button */}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ padding: '8px 12px' }}>
                <Button
                    type="default"
                    icon={<PlusOutlined />}
                    onClick={onNewField}
                    block
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 40,
                    }}
                >
                    New field
                </Button>
            </div>
        </div>
    );
}
