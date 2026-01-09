'use client';

import React, { useEffect, useMemo } from 'react';
import {
    BlockNoteSchema,
    createCodeBlockSpec,
    PartialBlock,
} from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { codeBlockOptions } from '@blocknote/code-block';
import '@blocknote/code-block/style.css';

// Code block with built-in syntax highlighting from @blocknote/code-block
const codeBlockSpec = createCodeBlockSpec(codeBlockOptions);

// Create schema with code block
const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...BlockNoteSchema.create().blockSpecs,
        codeBlock: codeBlockSpec,
    },
});

type EditorSchema = typeof schema;

interface RichTextEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    placeholder?: string;
}

const editorStyles: React.CSSProperties = {
    borderRadius: 8,
    overflow: 'hidden',
};

const editableStyles: React.CSSProperties = {
    border: '1px solid #d9d9d9',
};

export default function RichTextEditor({
    content = '',
    onChange,
    editable = true,
    placeholder = 'Start typing...',
}: RichTextEditorProps) {
    // Parse content to blocks
    const initialContent = useMemo(() => {
        if (!content) {
            return undefined;
        }
        try {
            // Try to parse as JSON (saved block content)
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed as PartialBlock<EditorSchema>[];
            }
        } catch {
            // If not JSON, convert plain text to paragraph blocks
            if (content.trim()) {
                return [
                    {
                        type: 'paragraph' as const,
                        content: content,
                    },
                ] as PartialBlock<EditorSchema>[];
            }
        }
        return undefined;
    }, [content]);

    const editor = useCreateBlockNote({
        schema,
        initialContent,
    });

    // Handle content changes
    useEffect(() => {
        if (onChange && editable) {
            const handleChange = () => {
                const blocks = editor.document;
                // Save as JSON string
                const jsonContent = JSON.stringify(blocks);
                onChange(jsonContent);
            };

            // Subscribe to changes
            editor.onChange(handleChange);
        }
    }, [editor, onChange, editable]);

    // Update content when prop changes (for external updates)
    useEffect(() => {
        if (!editable && content) {
            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    editor.replaceBlocks(editor.document, parsed as PartialBlock<EditorSchema>[]);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, [content, editable, editor]);

    return (
        <div style={{ ...editorStyles, ...(editable ? editableStyles : {}) }}>
            <BlockNoteView
                editor={editor}
                editable={editable}
                theme="light"
            />
        </div>
    );
}
