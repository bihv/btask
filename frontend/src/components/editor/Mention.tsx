'use client';

import { createReactInlineContentSpec } from '@blocknote/react';

// Mention inline content spec for BlockNote
export const Mention = createReactInlineContentSpec(
    {
        type: 'mention',
        propSchema: {
            userId: {
                default: '',
            },
            userName: {
                default: '',
            },
        },
        content: 'none',
    },
    {
        render: (props) => {
            return (
                <span
                    style={{
                        backgroundColor: 'var(--primary-color, #1890ff)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                    data-user-id={props.inlineContent.props.userId}
                >
                    @{props.inlineContent.props.userName}
                </span>
            );
        },
    }
);
