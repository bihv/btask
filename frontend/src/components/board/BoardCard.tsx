'use client';

import { Card, Typography, Button } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { Board } from '@/types';

const { Text } = Typography;

interface BoardCardProps {
    board: Board;
    onClick?: () => void;
    onToggleStar?: (boardId: string, isStarred: boolean) => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function BoardCard({ board, onClick, onToggleStar, className, style }: BoardCardProps) {
    const hasImage = !!board.background_image;

    return (
        <Card
            hoverable
            className={className}
            style={{
                background: hasImage
                    ? `url(${board.background_image}) center/cover`
                    : board.background_color,
                position: 'relative',
                ...style,
            }}
            styles={{
                body: { padding: 12 },
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
                    strong
                    style={{
                        color: 'white',
                        fontSize: 16,
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        wordBreak: 'break-word',
                    }}
                >
                    {board.title}
                </Text>
                {onToggleStar && (
                    <Button
                        type="text"
                        size="small"
                        icon={
                            board.is_starred ? (
                                <StarFilled style={{ color: '#f5cd47' }} />
                            ) : (
                                <StarOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
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
