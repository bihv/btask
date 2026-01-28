'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    defaultInlineContentSpecs,
    createCodeBlockSpec,
} from '@blocknote/core';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import {
    useCreateBlockNote,
    DefaultReactSuggestionItem,
    SuggestionMenuController,
} from '@blocknote/react';
import { fullCodeBlockOptions } from '@/lib/codeBlockConfig';
import { useTheme } from '@/providers/ThemeProvider';
import { uploadFile } from '@/lib/api';
import Lightbox, { SlideImage, SlideVideo } from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { Mention } from './Mention';
import { MentionSuggestionMenu, MentionSuggestionItem } from './MentionSuggestionMenu';
import { useWorkspaceMembers } from '@/hooks/useCards';

// Create code block with syntax highlighting for ALL languages
const codeBlock = createCodeBlockSpec(fullCodeBlockOptions);

// Create schema with syntax-highlighted code block and mention support
const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        codeBlock: codeBlock,
    },
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    },
});

interface RichTextEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    placeholder?: string;
    workspaceId?: string;
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

// Function to get mention menu items from workspace members  
// Note: BlockNote uses 'title' as React key, so we include id in title to ensure uniqueness
// but display only the name in the UI using a custom suggestion menu component
const getMentionMenuItems = (
    editor: typeof schema.BlockNoteEditor,
    members: { id: string; full_name: string; avatar_url?: string }[]
): (DefaultReactSuggestionItem & { userId: string; displayName: string; avatarUrl?: string })[] => {
    return members.map((member) => ({
        // Using id + name as title to ensure unique React key
        title: `${member.id}::${member.full_name}`,
        // Store original data for display
        userId: member.id,
        displayName: member.full_name,
        avatarUrl: member.avatar_url,
        onItemClick: () => {
            editor.insertInlineContent([
                {
                    type: 'mention',
                    props: {
                        userId: member.id,
                        userName: member.full_name,
                    },
                },
                ' ', // add a space after the mention
            ]);
        },
    }));
};

export default function RichTextEditor({
    content = '',
    onChange,
    editable = true,
    placeholder = 'Start typing...',
    workspaceId,
}: RichTextEditorProps) {
    const { resolvedTheme } = useTheme();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSlide, setLightboxSlide] = useState<(SlideImage | SlideVideo)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch workspace members for mentions
    const { data: workspaceMembers = [] } = useWorkspaceMembers(workspaceId || '');

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
                >
                    {/* Mention suggestion menu - only show when editable and has workspace */}
                    {editable && workspaceId && (
                        <SuggestionMenuController
                            triggerCharacter="@"
                            getItems={async (query) =>
                                filterSuggestionItems(getMentionMenuItems(editor, workspaceMembers), query)
                            }
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            suggestionMenuComponent={MentionSuggestionMenu as any}
                        />
                    )}
                </BlockNoteView>
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
