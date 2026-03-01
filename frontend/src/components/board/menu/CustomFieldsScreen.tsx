'use client';

import React, { useState, useEffect } from 'react';
import { Text, Title, Button, Loader, Divider, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheckbox, IconFlag, IconBolt, IconAlertTriangle, IconChevronRight, IconPlus, IconInfoCircle, IconCalendar, IconHash, IconLetterCase, IconApps, IconGripVertical } from '@tabler/icons-react';
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

// Icons for different field types
const getFieldIcon = (type: string, name?: string) => {
    // For default fields, use specific icons
    const nameLower = name?.toLowerCase() || '';
    if (nameLower === 'priority') return <IconBolt size={16} />;
    if (nameLower === 'status') return <IconFlag size={16} />;
    if (nameLower === 'risk') return <IconAlertTriangle size={16} />;
    if (nameLower === 'effort') return <IconBolt size={16} style={{ transform: 'scaleX(-1)' }} />;

    // For custom fields, use icons based on type
    switch (type) {
        case 'checkbox':
            return <IconCheckbox size={16} />;
        case 'dropdown':
            return <IconApps size={16} />;
        case 'text':
            return <IconLetterCase size={16} />;
        case 'number':
            return <IconHash size={16} />;
        case 'date':
            return <IconCalendar size={16} />;
        default:
            return <IconFlag size={16} />;
    }
};

interface SuggestedField {
    key: string;
    name: string;
    icon: React.ReactNode;
}

const suggestedFields: SuggestedField[] = [
    { key: 'priority', name: 'Priority', icon: <IconBolt size={16} /> },
    { key: 'status', name: 'Status', icon: <IconFlag size={16} /> },
    { key: 'risk', name: 'Risk', icon: <IconAlertTriangle size={16} /> },
    { key: 'effort', name: 'Effort', icon: <IconBolt size={16} style={{ transform: 'scaleX(-1)' }} /> },
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
                <IconGripVertical size={14} />
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
            <IconChevronRight size={12} style={{ cursor: 'pointer' }}
                onClick={() => onEditField(field)} />
        </div>
    );
}

export default function CustomFieldsScreen({ boardId, onBack, onNewField, onEditField }: CustomFieldsScreenProps) {
    const [fields, setFields] = useState<CustomField[]>([]);
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
                notifications.show({ title: 'Error', message: t('ERROR_REORDER_FIELD_FAILED'), color: 'red' });
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
            notifications.show({ title: 'Error', message: error.response?.data?.error || t('ERROR_ADD_FIELD_FAILED'), color: 'red' });
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
                <Loader />
            </div>
        );
    }

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={t('UI_CUSTOM_FIELDS')} onBack={onBack} />

            {/* Info button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 12px 8px' }}>
                <Tooltip label={t('UI_CUSTOM_FIELDS_TOOLTIP')}
                    position="bottom"
                >
                    <Button variant="subtle" size="sm" leftSection={<IconInfoCircle size={16} />} style={{ color: 'var(--text-secondary)' }}>
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
                        <Text c="dimmed" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                                size="sm"
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
                    variant="default"
                    leftSection={<IconPlus size={16} />}
                    onClick={onNewField}
                    fullWidth
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
