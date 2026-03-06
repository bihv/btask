'use client';

import { useTranslation } from '@/hooks/useLabels';
import { Card } from '@/types';
import { useState } from 'react';

import { Button, Divider, Modal, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconDownload, IconPrinter, IconQrcode, IconShare } from '@tabler/icons-react';
interface ShareCardModalProps {
    cardId: string;
    cardTitle: string;
    boardId: string;
    cardData?: Card;
    onPrint?: () => void;
}

export default function ShareCardModal({ cardId, cardTitle, boardId, cardData, onPrint }: ShareCardModalProps) {
    const [open, setOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const t = useTranslation();

    // Generate card URL
    const cardUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/boards/${boardId}/cards/${cardId}`
        : `/boards/${boardId}/cards/${cardId}`;

    // Generate embed code
    const embedCode = `<blockquote class="mello-card"><a href="${cardUrl}">${cardTitle}</a></blockquote>`;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        notifications.show({ message: `${label} copied!`, color: 'green' });
    };

    const handlePrint = () => {
        setOpen(false);
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    const handleExportJSON = () => {
        const exportData = cardData || {
            id: cardId,
            title: cardTitle,
            board_id: boardId,
            url: cardUrl,
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `card-${cardId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        notifications.show({ message: t('SUCCESS_JSON_EXPORTED'), color: 'green' });
        setOpen(false);
    };

    return (
        <>
            <Button leftSection={<IconShare size={16} />} size="sm" onClick={() => setOpen(true)}>
                {t('UI_SHARE')}
            </Button>
            <Modal
                title={t('UI_SHARE')}
                opened={open}
                onClose={() => setOpen(false)}
                size="md"
            >
                <div style={{ paddingTop: 16 }}>
                    {/* Print & Export */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} style={{ flex: 1 }}>
                            {t('UI_PRINT')}
                        </Button>
                        <Button leftSection={<IconDownload size={16} />} onClick={handleExportJSON} style={{ flex: 1 }}>
                            {t('UI_EXPORT_JSON')}
                        </Button>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Card Link */}
                    <div style={{ marginBottom: 16 }}>
                        <Text fw={700}>{t('UI_LINK_TO_CARD')}</Text>
                        <div style={{ display: 'flex', width: '100%' }}>
                            <TextInput
                                value={cardUrl}
                                readOnly
                                style={{ width: 'calc(100% - 32px)' }}
                            />
                            <Button
                                leftSection={<IconCopy size={16} />}
                                onClick={() => handleCopy(cardUrl, 'Link')}
                            />
                        </div>
                    </div>

                    {/* QR Code */}
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            variant="transparent"
                            leftSection={<IconQrcode size={16} />}
                            onClick={() => setShowQR(!showQR)}
                            style={{ padding: 0 }}
                        >
                            {showQR ? t('UI_HIDE_QR') : t('UI_SHOW_QR')}
                        </Button>
                        {showQR && (
                            <div style={{ marginTop: 12, textAlign: 'center' }}>
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>QR Code</div>
                            </div>
                        )}
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Embed Code */}
                    <div style={{ marginBottom: 16 }}>
                        <Text fw={700}>{t('UI_EMBED_CARD')}</Text>
                        <div style={{ display: 'flex', width: '100%' }}>
                            <TextInput
                                value={embedCode}
                                readOnly
                                style={{ width: 'calc(100% - 32px)', fontSize: 12 }}
                            />
                            <Button
                                leftSection={<IconCopy size={16} />}
                                onClick={() => handleCopy(embedCode, 'Embed code')}
                            />
                        </div>
                        <Text c="dimmed" style={{ fontSize: 12 }}>
                            {t('UI_EMBED_HINT')}
                        </Text>
                    </div>
                </div >
            </Modal >
        </>
    );
}
