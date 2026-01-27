'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    createCodeBlockSpec,
} from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { fullCodeBlockOptions } from '@/lib/codeBlockConfig';
import { useTheme } from '@/providers/ThemeProvider';
import { uploadFile } from '@/lib/api';
import Lightbox, { SlideImage, SlideVideo } from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

// Create code block with syntax highlighting for ALL languages
const codeBlock = createCodeBlockSpec(fullCodeBlockOptions);

// Create schema with syntax-highlighted code block
const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        codeBlock: codeBlock,
    },
});

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

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowercaseUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

export default function RichTextEditor({
    content = '',
    onChange,
    editable = true,
    placeholder = 'Start typing...',
}: RichTextEditorProps) {
    const { resolvedTheme } = useTheme();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSlide, setLightboxSlide] = useState<(SlideImage | SlideVideo)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse content to blocks
    const initialContent = useMemo(() => {
        if (!content) {
            return undefined;
        }
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // If not JSON, convert plain text to paragraph blocks
            if (content.trim()) {
                return [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: content }],
                    },
                ];
            }
        }
        return undefined;
    }, [content]);

    const editor = useCreateBlockNote({
        schema,
        initialContent,
        uploadFile,
    });

    // Handle content changes
    useEffect(() => {
        if (onChange && editable) {
            const handleChange = () => {
                const blocks = editor.document;
                const jsonContent = JSON.stringify(blocks);
                onChange(jsonContent);
            };
            editor.onChange(handleChange);
        }
    }, [editor, onChange, editable]);

    // Update content when prop changes (for external updates)
    useEffect(() => {
        if (!editable && content) {
            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    editor.replaceBlocks(editor.document, parsed);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, [content, editable, editor]);

    // Handle click on images/videos to open lightbox
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Check if clicked on an image
            if (target.tagName === 'IMG') {
                const imgSrc = (target as HTMLImageElement).src;
                if (imgSrc) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isVideoUrl(imgSrc)) {
                        // It's a video thumbnail
                        setLightboxSlide([{
                            type: 'video',
                            sources: [{ src: imgSrc, type: 'video/mp4' }],
                        }]);
                    } else {
                        // It's an image
                        setLightboxSlide([{ src: imgSrc }]);
                    }
                    setLightboxOpen(true);
                }
            }

            // Check if clicked on a video element
            if (target.tagName === 'VIDEO') {
                const videoSrc = (target as HTMLVideoElement).currentSrc ||
                    (target as HTMLVideoElement).src ||
                    target.querySelector('source')?.src;
                if (videoSrc) {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightboxSlide([{
                        type: 'video',
                        sources: [{ src: videoSrc, type: 'video/mp4' }],
                    }]);
                    setLightboxOpen(true);
                }
            }
        };

        container.addEventListener('click', handleClick);
        return () => container.removeEventListener('click', handleClick);
    }, []);

    return (
        <div style={{ ...editorStyles }}>
            <style>{`
                .bn-editor {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                }
                .bn-block-outer {
                    margin-left: 0 !important;
                }
            `}</style>
            <div ref={containerRef} className={!editable ? 'bn-readonly-mode' : ''}>
                <BlockNoteView
                    editor={editor}
                    editable={editable}
                    theme={resolvedTheme}
                    sideMenu={editable}
                />
            </div>
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxSlide}
                plugins={[Video, Zoom]}
                video={{
                    controls: true,
                    autoPlay: true,
                }}
            />
        </div>
    );
}
