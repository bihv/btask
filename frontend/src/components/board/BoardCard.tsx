'use client';

import { useAppToken } from '@/hooks/useAppToken';
import { Board } from '@/types';

import { Button, Card, Text } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
interface BoardCardProps {
    board: Board;
    onClick?: () => void;
    onToggleStar?: (boardId: string, isStarred: boolean) => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function BoardCard({ board, onClick, onToggleStar, className, style }: BoardCardProps) {
    const hasImage = !!board.background_image;
    const token = useAppToken();

    return (
        <Card
            withBorder
            className={className}
            style={{
                background: hasImage
                    ? `url(${board.background_image}) center/cover`
                    : board.background_color,
                position: 'relative',
                padding: 12,
                ...style,
            }}
            onClick={onClick}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <Text
                    fw={700}
                    style={{
                        color: token.colorWhite,
                        fontSize: 16,
                        textShadow: `0 1px 2px ${token.colorOverlayDarker}`,
                        wordBreak: 'break-word',
                    }}
                >
                    {board.title}
                </Text>
                {onToggleStar && (
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={
                            board.is_starred ? (
                                <IconStarFilled size={16} style={{ color: token.colorStarYellow }} />
                            ) : (
                                <IconStar size={16} style={{ color: token.colorOverlayLight }} />
                            )
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(board.id, board.is_starred);
                        }}
                    />
                )}
            </div>
        </Card>
    );
}
