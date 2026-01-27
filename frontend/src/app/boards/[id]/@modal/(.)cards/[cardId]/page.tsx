'use client';

import { useRouter, useParams } from 'next/navigation';
import { Modal, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import CardPage from '../../../cards/[cardId]/page';
import { useBoardStore } from '@/stores/boardStore';
import { useCard } from '@/hooks/useCards';
import DraggableCoverImage from '@/components/card/DraggableCoverImage';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';

const { Text } = Typography;

export default function CardModal() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const cardId = params.cardId as string;
    const { currentBoard } = useBoardStore();
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const { data: cardData } = useCard(cardId);
    const [coverPosition, setCoverPosition] = useState(cardData?.cover_image_y ?? 50);

    useEffect(() => {
        if (cardData) {
            setCoverPosition(cardData.cover_image_y ?? 50);
        }
    }, [cardData]);

    const handleClose = () => {
        router.back();
    };

    const handleCoverPositionSave = async (value: number) => {
        if (!cardData) return;
        try {
            await api.put(`/cards/${cardData.id}`, { cover_image_y: value });
            queryClient.invalidateQueries({ queryKey: ['card', cardId] });
        } catch (error) {
            message.error('Failed to update position');
        }
    };

    return (
        <Modal
            open={true}
            onCancel={handleClose}
            footer={null}
            width="90vw"
            style={{ maxWidth: 1200, top: 20 }}
            styles={{ body: { padding: 0 } }}
            destroyOnHidden={true}
            closeIcon={false}
            title={
                <div style={{ 
                    position: 'relative',
                    margin: '-20px -24px 0 -24px',
                    minHeight: cardData?.cover_image ? 200 : 60,
                    display: 'flex',
                    alignItems: 'flex-start',
                }}>
                    {cardData?.cover_image && (
                        <div style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}>
                            <DraggableCoverImage
                                imageUrl={cardData.cover_image}
                                position={coverPosition}
                                onPositionChange={setCoverPosition}
                                onPositionChangeComplete={handleCoverPositionSave}
                                height={200}
                            />
                        </div>
                    )}
                    <div style={{ 
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px 24px',
                        background: cardData?.cover_image 
                            ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)'
                            : 'transparent',
                        borderBottom: cardData?.cover_image ? 'none' : '1px solid var(--border-color)',
                    }}>
                        <Text strong style={{ 
                            fontSize: 16,
                            color: cardData?.cover_image ? 'white' : 'inherit',
                            textShadow: cardData?.cover_image ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                        }}>
                            {currentBoard?.title || 'Board'}
                        </Text>
                        <CloseOutlined 
                            onClick={handleClose}
                            style={{ 
                                cursor: 'pointer', 
                                fontSize: 16,
                                padding: 8,
                                borderRadius: 4,
                                color: cardData?.cover_image ? 'white' : 'inherit',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = cardData?.cover_image 
                                    ? 'rgba(255,255,255,0.2)' 
                                    : 'var(--bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        />
                    </div>
                </div>
            }
        >
            <CardPage isModal />
        </Modal>
    );
}
