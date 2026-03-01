'use client';

import React from 'react';
import { Template } from '@/types';
import { useAppToken } from '@/hooks/useAppToken';

import { Card, Text, Title, Badge } from '@mantine/core';

interface TemplateCardProps {
    template: Template;
    onClick?: () => void;
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
    const token = useAppToken();
    return (
        <Card
            withBorder
            className="template-card"
            onClick={onClick}
            style={{
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <Card.Section>
                <div
                    style={{
                        height: '140px',
                        backgroundColor: template.cover_color || token.colorTemplateBg,
                        backgroundImage: template.cover_url ? `url(${template.cover_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Small icon in bottom left like Trello templates */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            backgroundColor: token.colorWhite,
                            borderRadius: '4px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: token.colorTemplateDarkText
                        }}
                    >
                        TEMPLATE
                    </div>
                </div>
            </Card.Section>
            <style jsx global>{`
                .template-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                }
            `}</style>

            <div style={{ marginBottom: '8px' }}>
                <Text fw={700} style={{ fontSize: '14px', display: 'block', lineHeight: '1.4', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {template.title}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <Text c="dimmed" style={{ fontSize: '11px' }}>by {template.author}</Text>
                </div>
            </div>

            <Text
                lineClamp={3}
                style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', flex: 1 }}
            >
                {template.description}
            </Text>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge
                    variant="filled"
                    style={{
                        margin: 0,
                        fontSize: '10px',
                        padding: '0 6px',
                        lineHeight: '20px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                    }}
                >
                    {template.category}
                </Badge>
            </div>
        </Card>
    );
}
