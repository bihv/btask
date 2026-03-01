'use client';

import { useState } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { useCard } from '@/hooks/useCards';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import CardPageContent from '@/app/boards/[id]/cards/[cardId]/CardPageContent';

import { PluginProvider } from '@/components/plugins';
import { useTranslation } from '@/hooks/useLabels';
import { useAppToken } from '@/hooks/useAppToken';

import { Modal, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
interface CardModalWrapperProps {
    cardId: string;
    onClose: () => void;
}

export default function CardModalWrapper({ cardId, onClose }: CardModalWrapperProps) {
    const { currentBoard } = useBoardStore();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const { data: cardData } = useCard(cardId);
    const t = useTranslation();
    const token = useAppToken();

    return (
        <>
            <Modal
                opened={true}
                onClose={onClose}
                size="90vw"
                style={{ top: 20, maxHeight: 'calc(100vh - 40px)' }}
                styles={{
                    header: {
                        padding: 0,
                    },
                    title: {
                        width: '100%',
                    },
                    body: {
                        padding: 0,
                        maxHeight: 'calc(100vh - 240px)',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    },
                }}
                className="card-modal-hide-scrollbar"
                withCloseButton={false}
                title={
                    <div style={{
                        position: 'relative',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        overflow: 'hidden',
                        width: '100%',
                        minHeight: cardData?.cover_image ? 160 : 60,
                        display: 'flex',
                        alignItems: 'flex-start',
                        backgroundColor: cardData?.cover_bg_color || 'transparent',
                    }}>
                        {cardData?.cover_image && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: '100%',
                                    backgroundColor: cardData.cover_bg_color || 'var(--bg-tertiary)',
                                    backgroundImage: `url("${cardData.cover_image}")`,
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
                                ? `linear-gradient(to bottom, ${token.colorOverlayDarker} 0%, transparent 100%)`
                                : 'transparent',
                            borderBottom: cardData?.cover_image ? 'none' : '1px solid var(--border-color)',
                        }}>
                            <Text fw={700} style={{
                                fontSize: 16,
                                color: cardData?.cover_image ? token.colorWhite : 'inherit',
                                textShadow: cardData?.cover_image ? `0 1px 2px ${token.colorOverlayDark}` : 'none',
                            }}>
                                {currentBoard?.title || t('UI_BOARD')}
                            </Text>
                            <div
                                onClick={onClose}
                                style={{
                                    cursor: 'pointer',
                                    padding: 4,
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = cardData?.cover_image
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'var(--bg-tertiary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <IconX size={16} />
                            </div>
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
