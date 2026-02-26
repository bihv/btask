'use client';

import { Card, Typography, Button } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { Board } from '@/types';
import { useAppToken } from '@/hooks/useAppToken';

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
    const token = useAppToken();

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
                        type="text"
                        size="small"
                        icon={
                            board.is_starred ? (
                                <StarFilled style={{ color: token.colorStarYellow }} />
                            ) : (
                                <StarOutlined style={{ color: token.colorOverlayLight }} />
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
