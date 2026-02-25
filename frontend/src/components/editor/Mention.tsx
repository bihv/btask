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
                        color: 'var(--primary-color)',
                        padding: '1px 5px',
                        borderRadius: 10,
                        cursor: 'pointer',
                    }}
                    data-user-id={props.inlineContent.props.userId}
                >
                    @{props.inlineContent.props.userName}
                </span>
            );
        },
    }
);
