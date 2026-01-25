'use client';

import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { Template } from '@/types';

const { Text, Paragraph } = Typography;

interface TemplateCardProps {
    template: Template;
    onClick?: () => void;
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
    return (
        <Card
            hoverable
            className="template-card"
            onClick={onClick}
            cover={
                <div
                    style={{
                        height: '140px',
                        backgroundColor: template.cover_color || '#f4f5f7',
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
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#172b4d'
                        }}
                    >
                        TEMPLATE
                    </div>
                </div>
            }
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
            styles={{ body: { padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' } }}
        >
             <style jsx global>{`
                .template-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                }
            `}</style>
            
            <div style={{ marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '14px', display: 'block', lineHeight: '1.4', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {template.title}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>by {template.author}</Text>
                </div>
            </div>

            <Paragraph 
                ellipsis={{ rows: 3 }} 
                style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', flex: 1 }}
            >
                {template.description}
            </Paragraph>
            
             <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Tag 
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
                 </Tag>
             </div>
        </Card>
    );
}
