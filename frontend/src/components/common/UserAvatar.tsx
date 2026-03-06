'use client';

import { Avatar } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import React from 'react';

// System avatars definition - shared with ProfileVisibilityTab
export const SYSTEM_AVATARS = [
    // Animals - Cute
    { id: 'cat', emoji: '🐱', bg: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)' },
    { id: 'dog', emoji: '🐶', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'fox', emoji: '🦊', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'panda', emoji: '🐼', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'koala', emoji: '🐨', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'lion', emoji: '🦁', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'unicorn', emoji: '🦄', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'dragon', emoji: '🐲', bg: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)' },
    { id: 'wolf', emoji: '🐺', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'bear', emoji: '🐻', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'rabbit', emoji: '🐰', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'owl', emoji: '🦉', bg: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
    { id: 'penguin', emoji: '🐧', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { id: 'octopus', emoji: '🐙', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'butterfly', emoji: '🦋', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'dolphin', emoji: '🐬', bg: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)' },
    { id: 'tiger', emoji: '🐯', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'monkey', emoji: '🐵', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'elephant', emoji: '🐘', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'giraffe', emoji: '🦒', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'zebra', emoji: '🦓', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'horse', emoji: '🐴', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'pig', emoji: '🐷', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'cow', emoji: '🐮', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'frog', emoji: '🐸', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'snake', emoji: '🐍', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'turtle', emoji: '🐢', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'shark', emoji: '🦈', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'whale', emoji: '🐳', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'bee', emoji: '🐝', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },

    // Space & Nature
    { id: 'rocket', emoji: '🚀', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'star', emoji: '⭐', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'moon', emoji: '🌙', bg: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
    { id: 'sun', emoji: '☀️', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'rainbow', emoji: '🌈', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'fire', emoji: '🔥', bg: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
    { id: 'snowflake', emoji: '❄️', bg: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)' },
    { id: 'lightning', emoji: '⚡', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'earth', emoji: '🌍', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { id: 'saturn', emoji: '🪐', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'ufo', emoji: '🛸', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'comet', emoji: '☄️', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'cloud', emoji: '☁️', bg: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)' },
    { id: 'tree', emoji: '🌳', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'flower', emoji: '🌸', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'mushroom', emoji: '🍄', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },

    // Fun Characters
    { id: 'alien', emoji: '👽', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'robot', emoji: '🤖', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'ghost', emoji: '👻', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'ninja', emoji: '🥷', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'wizard', emoji: '🧙', bg: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)' },
    { id: 'fairy', emoji: '🧚', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'mermaid', emoji: '🧜‍♀️', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'superhero', emoji: '🦸', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'pirate', emoji: '🏴‍☠️', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { id: 'clown', emoji: '🤡', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'vampire', emoji: '🧛', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'zombie', emoji: '🧟', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },

    // Objects & Symbols
    { id: 'crown', emoji: '👑', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'diamond', emoji: '💎', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'heart', emoji: '❤️', bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { id: 'music', emoji: '🎵', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'game', emoji: '🎮', bg: 'linear-gradient(135deg, #206A5D 0%, #3DA88E 100%)' },
    { id: 'coffee', emoji: '☕', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'pizza', emoji: '🍕', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'cake', emoji: '🎂', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 'icecream', emoji: '🍦', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'soccer', emoji: '⚽', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'basketball', emoji: '🏀', bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
    { id: 'guitar', emoji: '🎸', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'camera', emoji: '📷', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
    { id: 'palette', emoji: '🎨', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'book', emoji: '📚', bg: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    { id: 'laptop', emoji: '💻', bg: 'linear-gradient(135deg, #536976 0%, #292e49 100%)' },
];

// Helper to get initials from name
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper to parse avatar URL and get emoji data
export const parseAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return { isEmoji: false, emoji: null, imageUrl: null };

    if (avatarUrl.startsWith('emoji:')) {
        const emojiId = avatarUrl.replace('emoji:', '');
        const emojiData = SYSTEM_AVATARS.find(a => a.id === emojiId);
        return { isEmoji: true, emoji: emojiData, imageUrl: null };
    }

    return { isEmoji: false, emoji: null, imageUrl: avatarUrl };
};

export interface UserAvatarProps {
    /** Avatar URL - can be image URL or emoji:id format */
    avatarUrl?: string;
    /** User's full name for fallback initials */
    name?: string;
    /** Size of the avatar */
    size?: number | 'small' | 'default' | 'large';
    /** Additional styles */
    style?: React.CSSProperties;
    /** Click handler */
    onClick?: () => void;
    /** CSS class name */
    className?: string;
}

export default function UserAvatar({
    avatarUrl,
    name,
    size = 'default',
    style,
    onClick,
    className,
}: UserAvatarProps) {
    const { isEmoji, emoji, imageUrl } = parseAvatarUrl(avatarUrl);

    // Calculate numeric size
    const numericSize = typeof size === 'number'
        ? size
        : size === 'small' ? 24 : size === 'large' ? 40 : 32;

    // Calculate emoji font size (roughly half of avatar size)
    const emojiFontSize = Math.floor(numericSize * 0.5);

    // Render emoji avatar
    if (isEmoji && emoji) {
        return (
            <div
                className={className}
                onClick={onClick}
                style={{
                    width: numericSize,
                    height: numericSize,
                    borderRadius: '50%',
                    background: emoji.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: emojiFontSize,
                    cursor: onClick ? 'pointer' : 'default',
                    flexShrink: 0,
                    ...style,
                }}
            >
                {emoji.emoji}
            </div>
        );
    }

    // Render image avatar or fallback
    return (
        <Avatar
            className={className}
            size={numericSize}
            src={imageUrl}
            onClick={onClick}
            color="blue"
            style={{
                cursor: onClick ? 'pointer' : 'default',
                flexShrink: 0,
                ...style,
            }}
        >
            {!imageUrl && name ? getInitials(name) : (!imageUrl ? <IconUser size={numericSize * 0.5} /> : null)}
        </Avatar>
    );
}
