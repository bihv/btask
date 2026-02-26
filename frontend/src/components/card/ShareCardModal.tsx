'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Typography, Divider, QRCode, App, Space } from 'antd';
import { ShareAltOutlined, CopyOutlined, QrcodeOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { Card } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

const { Text } = Typography;

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
    const { message } = App.useApp();
    const t = useTranslation();

    // Generate card URL
    const cardUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/boards/${boardId}/cards/${cardId}`
        : `/boards/${boardId}/cards/${cardId}`;

    // Generate embed code
    const embedCode = `<blockquote class="mello-card"><a href="${cardUrl}">${cardTitle}</a></blockquote>`;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} ${t('SUCCESS_COPIED')}`);
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

        message.success(t('SUCCESS_JSON_EXPORTED'));
        setOpen(false);
    };

    return (
        <>
            <Button icon={<ShareAltOutlined />} size="small" onClick={() => setOpen(true)}>
                {t('UI_SHARE')}
            </Button>
            <Modal
                title={t('UI_SHARE')}
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={400}
            >
                <div style={{ paddingTop: 16 }}>
                    {/* Print & Export */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ flex: 1 }}>
                            {t('UI_PRINT')}
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={handleExportJSON} style={{ flex: 1 }}>
                            {t('UI_EXPORT_JSON')}
                        </Button>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Card Link */}
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('UI_LINK_TO_CARD')}</Text>
                        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
                            <Input
                                value={cardUrl}
                                readOnly
                                style={{ width: 'calc(100% - 32px)' }}
                            />
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(cardUrl, 'Link')}
                            />
                        </Space.Compact>
                    </div>

                    {/* QR Code */}
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="link"
                            icon={<QrcodeOutlined />}
                            onClick={() => setShowQR(!showQR)}
                            style={{ padding: 0 }}
                        >
                            {showQR ? t('UI_HIDE_QR') : t('UI_SHOW_QR')}
                        </Button>
                        {showQR && (
                            <div style={{ marginTop: 12, textAlign: 'center' }}>
                                <QRCode value={cardUrl} size={150} />
                            </div>
                        )}
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Embed Code */}
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('UI_EMBED_CARD')}</Text>
                        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
                            <Input
                                value={embedCode}
                                readOnly
                                style={{ width: 'calc(100% - 32px)', fontSize: 12 }}
                            />
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(embedCode, 'Embed code')}
                            />
                        </Space.Compact>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('UI_EMBED_HINT')}
                        </Text>
                    </div>
                </div>
            </Modal>
        </>
    );
}
