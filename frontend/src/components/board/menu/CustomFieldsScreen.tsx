'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Spin, Divider, Tooltip, App } from 'antd';
import {
    CheckSquareOutlined,
    FlagOutlined,
    ThunderboltOutlined,
    WarningOutlined,
    RightOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    CalendarOutlined,
    NumberOutlined,
    FontSizeOutlined,
    AppstoreOutlined,
    HolderOutlined,
} from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CustomField } from '@/types';
import { customFieldApi } from '@/lib/api';
import { ScreenHeader } from './MenuShared';
import { useTranslation } from '@/hooks/useLabels';

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
            return <CheckSquareOutlined />;
        case 'dropdown':
            return <AppstoreOutlined />;
        case 'text':
            return <FontSizeOutlined />;
        case 'number':
            return <NumberOutlined />;
        case 'date':
            return <CalendarOutlined />;
        default:
            return <FlagOutlined />;
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

// Sortable field item component
interface SortableFieldItemProps {
    field: CustomField;
    onEditField: (field: CustomField) => void;
}

function SortableFieldItem({ field, onEditField }: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: 4,
                backgroundColor: isDragging ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
                if (!isDragging) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
                if (!isDragging) e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                style={{
                    cursor: 'grab',
                    padding: '4px',
                    marginRight: 6,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <HolderOutlined />
            </div>

            <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
                onClick={() => onEditField(field)}
            >
                <span style={{ opacity: 0.7 }}>
                    {getFieldIcon(field.type, field.name)}
                </span>
                <Text>{field.name}</Text>
            </div>
            <RightOutlined
                style={{ fontSize: 12, opacity: 0.5, cursor: 'pointer' }}
                onClick={() => onEditField(field)}
            />
        </div>
    );
}

export default function CustomFieldsScreen({ boardId, onBack, onNewField, onEditField }: CustomFieldsScreenProps) {
    const [fields, setFields] = useState<CustomField[]>([]);
    const { message } = App.useApp();
    const t = useTranslation();
    const [loading, setLoading] = useState(true);
    const [addingDefault, setAddingDefault] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);

            // Optimistic update
            const newFields = arrayMove(fields, oldIndex, newIndex);
            setFields(newFields);

            // Update positions for all reordered fields
            try {
                // Update positions sequentially 
                await Promise.all(
                    newFields.map((field, index) =>
                        customFieldApi.update(field.id, { position: index })
                    )
                );
            } catch (error) {
                message.error(t('ERROR_REORDER_FIELD_FAILED'));
                loadFields(); // Revert on error
            }
        }
    };

    const handleAddDefaultField = async (fieldKey: string) => {
        setAddingDefault(fieldKey);
        try {
            await customFieldApi.addDefaultField(boardId, fieldKey);
            loadFields();
        } catch (error: any) {
            message.error(error.response?.data?.error || t('ERROR_ADD_FIELD_FAILED'));
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
            <ScreenHeader title={t('UI_CUSTOM_FIELDS')} onBack={onBack} />

            {/* Info button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 12px 8px' }}>
                <Tooltip
                    title={t('UI_CUSTOM_FIELDS_TOOLTIP')}
                    placement="bottom"
                >
                    <Button type="text" size="small" icon={<InfoCircleOutlined />} style={{ color: 'var(--text-secondary)' }}>
                        {t('UI_ABOUT_CUSTOM_FIELDS')}
                    </Button>
                </Tooltip>
            </div>

            {/* Existing custom fields with drag and drop */}
            {fields.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={fields.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div style={{ marginBottom: 8 }}>
                            {fields.map((field) => (
                                <SortableFieldItem
                                    key={field.id}
                                    field={field}
                                    onEditField={onEditField}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Suggested fields section */}
            {availableSuggestedFields.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '8px 12px' }}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('UI_SUGGESTED_FIELDS')}
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
                                {t('UI_ADD')}
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
                    {t('UI_NEW_FIELD')}
                </Button>
            </div>
        </div>
    );
}
