'use client';

import { useState } from 'react';
import { Modal, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import { useCard } from '@/hooks/useCards';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import CardPageContent from '@/app/boards/[id]/cards/[cardId]/CardPageContent';

import { PluginProvider } from '@/components/plugins';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

interface CardModalWrapperProps {
    cardId: string;
    onClose: () => void;
}

export default function CardModalWrapper({ cardId, onClose }: CardModalWrapperProps) {
    const { currentBoard } = useBoardStore();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const { data: cardData } = useCard(cardId);
    const t = useTranslation();



    return (
        <>
            <Modal
                open={true}
                onCancel={onClose}
                footer={null}
                width="90vw"
                style={{ top: 20, maxHeight: 'calc(100vh - 40px)' }}
                styles={{
                    body: {
                        padding: 0,
                        maxHeight: 'calc(100vh - 240px)',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    },
                }}
                className="card-modal-hide-scrollbar"
                destroyOnHidden={true}
                closeIcon={false}
                title={
                    <div style={{
                        position: 'relative',
                        margin: '-20px -24px 0 -24px',
                        borderRadius: '8px 8px 0 0',
                        overflow: 'hidden',
                        minHeight: cardData?.cover_image ? 160 : 60,
                        display: 'flex',
                        alignItems: 'flex-start',
                    }}>
                        {cardData?.cover_image && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 160,
                                    backgroundColor: cardData.cover_bg_color || 'var(--bg-tertiary)',
                                    backgroundImage: `url(${cardData.cover_image})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setLightboxOpen(true)}
                            />
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
                                {currentBoard?.title || t('UI_BOARD')}
                            </Text>
                            <CloseOutlined
                                onClick={onClose}
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
                <PluginProvider boardId={currentBoard?.id || ''}>
                    <CardPageContent />
                </PluginProvider>
            </Modal>

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={cardData?.cover_image ? [{ src: cardData.cover_image }] : []}
                plugins={[Zoom]}
            />
        </>
    );
}
