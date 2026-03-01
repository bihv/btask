'use client';

import React, { useMemo } from 'react';
import type { PropertySchema, SelectOption } from '@/types/automation';

import { Select, TextInput, NumberInput, Badge, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';


// ============================================================================
// Types
// ============================================================================

interface SentenceTemplateRendererProps {
    /** The sentence template with placeholders like {property_name} */
    template: string;
    /** Schema properties keyed by property name */
    properties: Record<string, PropertySchema>;
    /** Current configuration values */
    config: Record<string, any>;
    /** Callback when a value changes */
    onChange: (key: string, value: any) => void;
    /** Context data for pickers (lists, labels, members, etc.) */
    context?: {
        lists?: Array<{ id: string; title: string }>;
        labels?: Array<{ id: string; name: string; color?: string }>;
        members?: Array<{ id: string; username?: string; full_name?: string }>;
        boards?: Array<{ id: string; title: string }>;
    };
    /** Whether the component is in read-only mode */
    readOnly?: boolean;
}

interface ParsedPart {
    type: 'static' | 'placeholder';
    value: string;
    propertyKey?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a sentence template into static text and placeholders
 * Example: "when a card is {verb} to list {list_id}"
 * Returns: [
 *   { type: 'static', value: 'when a card is ' },
 *   { type: 'placeholder', value: 'verb', propertyKey: 'verb' },
 *   { type: 'static', value: ' to list ' },
 *   { type: 'placeholder', value: 'list_id', propertyKey: 'list_id' }
 * ]
 */
function parseTemplate(template: string): ParsedPart[] {
    const parts: ParsedPart[] = [];
    const regex = /\{([^}]+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        // Add static text before the placeholder
        if (match.index > lastIndex) {
            parts.push({
                type: 'static',
                value: template.slice(lastIndex, match.index),
            });
        }

        // Add the placeholder
        parts.push({
            type: 'placeholder',
            value: match[1],
            propertyKey: match[1],
        });

        lastIndex = regex.lastIndex;
    }

    // Add any remaining static text
    if (lastIndex < template.length) {
        parts.push({
            type: 'static',
            value: template.slice(lastIndex),
        });
    }

    return parts;
}

/**
 * Get display value for a property based on widget type
 */
function getDisplayValue(
    value: any,
    property: PropertySchema,
    context: SentenceTemplateRendererProps['context']
): { text: string; isEmpty: boolean } {
    const widget = property.widget || 'input';

    // Handle empty values with descriptive placeholder
    if (value === undefined || value === null || value === '') {
        switch (widget) {
            case 'list_select':
            case 'list_picker':
                return { text: 'any list', isEmpty: true };
            case 'label_select':
            case 'label_picker':
                return { text: 'any label', isEmpty: true };
            case 'member_select':
            case 'user_select':
            case 'member_picker':
            case 'user_picker':
                return { text: 'any member', isEmpty: true };
            case 'board_select':
            case 'board_picker':
                return { text: 'any board', isEmpty: true };
            case 'select':
                return { text: '...', isEmpty: true };
            default:
                return { text: '...', isEmpty: true };
        }
    }

    let displayText = '';
    switch (widget) {
        case 'list_select':
        case 'list_picker':
            const list = context?.lists?.find(l => l.id === value);
            displayText = list?.title || value;
            break;

        case 'label_select':
        case 'label_picker':
            const label = context?.labels?.find(l => l.id === value);
            displayText = label?.name || value;
            break;

        case 'member_select':
        case 'user_select':
        case 'member_picker':
        case 'user_picker':
            const member = context?.members?.find(m => m.id === value);
            displayText = member?.full_name || member?.username || value;
            break;

        case 'board_select':
        case 'board_picker':
            const board = context?.boards?.find(b => b.id === value);
            displayText = board?.title || value;
            break;

        case 'select':
            const option = property.options?.find(o => o.value === value);
            displayText = option?.label || value;
            break;

        default:
            displayText = String(value);
    }

    return { text: displayText, isEmpty: false };
}

// ============================================================================
// Main Component
// ============================================================================

export default function SentenceTemplateRenderer({
    template,
    properties,
    config,
    onChange,
    context = {},
    readOnly = false,
}: SentenceTemplateRendererProps) {


    // Parse template into parts
    const parts = useMemo(() => parseTemplate(template), [template]);

    // Render a single placeholder part
    const renderPlaceholder = (part: ParsedPart) => {
        const propertyKey = part.propertyKey!;
        const property = properties[propertyKey];

        if (!property) {
            // Property not found in schema, show as editable text
            return (
                <TextInput
                    size="sm"
                    placeholder={propertyKey}
                    value={config[propertyKey] || ''}
                    onChange={e => onChange(propertyKey, e.target.value)}
                    style={{ width: 120, margin: '0 4px' }}
                    disabled={readOnly}
                />
            );
        }

        const value = config[propertyKey];
        const widget = property.widget || 'input';

        if (readOnly) {
            const displayValue = getDisplayValue(value, property, context);
            return (
                <Tooltip label={property.description}>
                    <Badge
                        color="blue"
                        style={{
                            margin: '0 2px',
                            cursor: 'default',
                        }}
                    >
                        {displayValue.text}
                    </Badge>
                </Tooltip>
            );
        }

        // Render appropriate widget based on type
        switch (widget) {
            case 'select':
                return (
                    <Select
                        size="sm"
                        placeholder={property.label}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ minWidth: 120, margin: '0 4px' }}
                        data={property.options?.map(o => ({ value: o.value, label: o.label })) || []}
                    />
                );

            case 'list_select':
            case 'list_picker':
                return (
                    <Select
                        size="sm"
                        placeholder={property.label || 'Select list'}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ minWidth: 140, margin: '0 4px' }}
                        searchable
                        data={context.lists?.map(l => ({ value: l.id, label: l.title })) || []}
                    />
                );

            case 'label_select':
            case 'label_picker':
                return (
                    <Select
                        size="sm"
                        placeholder={property.label || 'Select label'}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ minWidth: 140, margin: '0 4px' }}
                        searchable
                        data={context.labels?.map(l => ({
                            value: l.id,
                            label: l.name || l.id,
                        })) || []}
                    />
                );

            case 'member_select':
            case 'user_select':
            case 'member_picker':
            case 'user_picker':
                return (
                    <Select
                        size="sm"
                        placeholder={property.label || 'Select member'}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ minWidth: 140, margin: '0 4px' }}
                        searchable
                        data={context.members?.map(m => ({
                            value: m.id,
                            label: m.full_name || m.username || m.id,
                        })) || []}
                    />
                );

            case 'board_select':
            case 'board_picker':
                return (
                    <Select
                        size="sm"
                        placeholder={property.label || 'Select board'}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ minWidth: 160, margin: '0 4px' }}
                        searchable
                        data={context.boards?.map(b => ({ value: b.id, label: b.title })) || []}
                    />
                );

            case 'number':
                return (
                    <NumberInput
                        size="sm"
                        placeholder={property.label}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ width: 80, margin: '0 4px' }}
                        min={property.min}
                        max={property.max}
                    />
                );

            case 'date':
            case 'datetime':
                return (
                    <DatePickerInput
                        size="sm"
                        placeholder={property.label}
                        value={value}
                        onChange={v => onChange(propertyKey, v)}
                        style={{ margin: '0 4px' }}
                    />
                );

            case 'input':
            case 'textarea':
            default:
                return (
                    <TextInput
                        size="sm"
                        placeholder={property.label || property.placeholder}
                        value={value || ''}
                        onChange={e => onChange(propertyKey, e.target.value)}
                        style={{ width: 120, margin: '0 4px' }}
                    />
                );
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                padding: '8px 0',
                fontSize: 14,
                lineHeight: '32px',
            }}
        >
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {part.type === 'static' ? (
                        <span style={{ color: 'var(--mantine-color-dimmed)' }}>
                            {part.value}
                        </span>
                    ) : (
                        renderPlaceholder(part)
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// Display-only variant (for rule list)
// ============================================================================

interface SentenceDisplayProps {
    template: string;
    config: Record<string, any>;
    properties: Record<string, PropertySchema>;
    context?: SentenceTemplateRendererProps['context'];
}

export function SentenceDisplay({ template, config, properties, context = {} }: SentenceDisplayProps) {
    const parts = useMemo(() => parseTemplate(template), [template]);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.type === 'static') {
                    return <span key={index}>{part.value}</span>;
                }

                const propertyKey = part.propertyKey!;
                const property = properties[propertyKey] || { name: propertyKey };
                const value = config[propertyKey];
                const { text } = getDisplayValue(value, property as PropertySchema, context);

                return (
                    <strong key={index} style={{ color: '#1890ff' }}>
                        {text}
                    </strong>
                );
            })}
        </span>
    );
}
