'use client';

import { Text, TextInput, Textarea } from '@mantine/core';
import React, { useEffect, useState } from 'react';

interface EditableTitleProps {
    value: string;
    onSave: (newValue: string) => Promise<void> | void;
    placeholder?: string;
    style?: React.CSSProperties;
    textStyle?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    strong?: boolean;
    disabled?: boolean;
    multiline?: boolean;
}

export default function EditableTitle({
    value,
    onSave,
    placeholder = 'Enter text...',
    style,
    textStyle,
    inputStyle,
    size,
    strong = false,
    disabled = false,
    multiline = false,
}: EditableTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    const [loading, setLoading] = useState(false);

    // Sync with prop changes
    useEffect(() => {
        setText(value);
    }, [value]);

    const handleSave = async () => {
        const trimmed = text.trim();

        // Revert if empty
        if (!trimmed) {
            setText(value);
            setIsEditing(false);
            return;
        }

        // Only save if changed
        if (trimmed !== value) {
            setLoading(true);
            try {
                await onSave(trimmed);
            } catch (error) {
                // Revert on error
                setText(value);
            } finally {
                setLoading(false);
            }
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setText(value);
        setIsEditing(false);
    };

    if (isEditing) {
        if (multiline) {
            return (
                <Textarea
                    autoFocus
                    autosize
                    minRows={1}
                    maxRows={6}
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSave();
                        }
                        if (e.key === 'Escape') {
                            handleCancel();
                        }
                    }}
                    placeholder={placeholder}
                    style={{ ...style, ...inputStyle }}
                    size={size}
                    disabled={loading}
                />
            );
        }

        return (
            <TextInput
                autoFocus
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSave();
                    }
                    if (e.key === 'Escape') {
                        handleCancel();
                    }
                }}
                placeholder={placeholder}
                style={{ ...style, ...inputStyle }}
                size={size}
                disabled={loading}
            />
        );
    }

    return (
        <Text
            fw={700}
            onClick={() => !disabled && setIsEditing(true)}
            style={{
                cursor: disabled ? 'default' : 'pointer',
                ...style,
                ...textStyle,
            }}
        >
            {value || placeholder}
        </Text>
    );
}
