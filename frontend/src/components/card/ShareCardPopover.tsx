'use client';

import React, { useState } from 'react';
import { Popover, Button, Input, Typography, Divider, message, QRCode } from 'antd';
import { ShareAltOutlined, CopyOutlined, QrcodeOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { Card } from '@/types';

const { Text } = Typography;

interface ShareCardPopoverProps {
    cardId: string;
    cardTitle: string;
    boardId: string;
    cardData?: Card;
}

export default function ShareCardPopover({ cardId, cardTitle, boardId, cardData }: ShareCardPopoverProps) {
    const [open, setOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);

    // Generate card URL
    const cardUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/boards/${boardId}/cards/${cardId}`
        : `/boards/${boardId}/cards/${cardId}`;

    // Generate embed code
    const embedCode = `<blockquote class="mello-card"><a href="${cardUrl}">${cardTitle}</a></blockquote>`;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard`);
    };

    const handlePrint = () => {
        setOpen(false);
        setTimeout(() => {
            window.print();
        }, 100);
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

        message.success('JSON exported');
        setOpen(false);
    };

    const content = (
        <div style={{ width: 320 }}>
            {/* Print & Export */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ flex: 1 }}>
                    Print
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportJSON} style={{ flex: 1 }}>
                    Export JSON
                </Button>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Card Link */}
            <div style={{ marginBottom: 16 }}>
                <Text strong>Link to this card</Text>
                <Input.Group compact style={{ marginTop: 8 }}>
                    <Input
                        value={cardUrl}
                        readOnly
                        style={{ width: 'calc(100% - 32px)' }}
                    />
                    <Button
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(cardUrl, 'Link')}
                    />
                </Input.Group>
            </div>

            {/* QR Code */}
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="link"
                    icon={<QrcodeOutlined />}
                    onClick={() => setShowQR(!showQR)}
                    style={{ padding: 0 }}
                >
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
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
                <Text strong>Embed this card</Text>
                <Input.Group compact style={{ marginTop: 8 }}>
                    <Input
                        value={embedCode}
                        readOnly
                        style={{ width: 'calc(100% - 32px)', fontSize: 12 }}
                    />
                    <Button
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(embedCode, 'Embed code')}
                    />
                </Input.Group>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Paste this HTML code where you want the card link to appear
                </Text>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            title="Share"
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
        >
            <Button icon={<ShareAltOutlined />} style={{ flex: 1 }}>
                Share
            </Button>
        </Popover>
    );
}

