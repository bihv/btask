'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Typography, Button, Breadcrumb, Row, Col, Divider, App, Spin } from 'antd';
import { ShareAltOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { useTemplate, useTemplates, Template } from '@/hooks/useTemplates';
import BoardPreview from '@/components/templates/BoardPreview';
import TemplateCard from '@/components/templates/TemplateCard';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Spin size="small" />,
});

const { Title, Text } = Typography;

export default function TemplateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { message } = App.useApp();
    const id = params.id as string;

    const { data: template, isLoading, error } = useTemplate(id);
    const { data: templatesData } = useTemplates({ limit: 4 });

    // Get related templates (exclude current one)
    const relatedTemplates = (templatesData?.templates || [])
        .filter((t: Template) => t.id !== id)
        .slice(0, 3);

    if (isLoading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !template) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Title level={3}>Template not found</Title>
                <Button type="primary" onClick={() => router.push('/templates')}>
                    Back to Templates
                </Button>
            </div>
        );
    }

    const formatNumber = (num?: number) => {
        if (!num) return '0';
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleUseTemplate = () => {
        message.info('Creating board from template...');
        // TODO: Implement actual template creation
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success('Link copied to clipboard!');
    };

    // Convert API lists format to BoardPreview format
    const previewLists = template.lists?.map((list, listIndex) => ({
        id: list.id || `list-${listIndex}`,
        title: list.title,
        color: list.color || '',
        cards: list.cards?.map((card, cardIndex) => ({
            id: card.id || `card-${listIndex}-${cardIndex}`,
            title: card.title,
            description: card.description,
            cover_url: card.cover_url,
            due_date: card.due_date,
        })) || [],
    })) || [];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumb
                style={{ marginBottom: '24px' }}
                items={[
                    { title: <a onClick={() => router.push('/templates')}>Template gallery</a> },
                    { title: template.category || 'Templates' },
                    { title: template.title },
                ]}
            />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Template icon */}
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: template.cover_color || '#0079bf',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img src="/mello-icon-only.svg" alt="Mello" style={{ width: '28px', height: '28px', filter: 'brightness(0) invert(1)' }} />
                    </div>

                    <div>
                        <Title level={2} style={{ margin: 0, marginBottom: '4px' }}>{template.title}</Title>
                        <Text type="secondary">Created by {template.author || 'Mello'}</Text>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CopyOutlined style={{ color: 'var(--text-secondary)' }} />
                                <Text type="secondary">{formatNumber(template.copies)} Copies</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <EyeOutlined style={{ color: 'var(--text-secondary)' }} />
                                <Text type="secondary">{formatNumber((template.views || 0) + 1)} Views</Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                        Share
                    </Button>
                    <Button type="primary" onClick={handleUseTemplate}>
                        Use template
                    </Button>
                </div>
            </div>

            {/* About section */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={4} style={{ marginBottom: '16px' }}>About this template</Title>
                {template.full_description ? (
                    <RichTextEditor
                        content={template.full_description}
                        editable={false}
                    />
                ) : (
                    <Text type="secondary">{template.description || 'No description available.'}</Text>
                )}
            </div>

            {/* Board Preview */}
            {previewLists.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <BoardPreview lists={previewLists} title={template.title} />
                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <Button type="link" style={{ padding: 0 }}>
                            View template →
                        </Button>
                    </div>
                </div>
            )}

            <Divider />

            {/* Related Templates */}
            {relatedTemplates.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <div
                        style={{
                            backgroundColor: '#e4f0f6',
                            borderRadius: '8px',
                            padding: '24px',
                        }}
                    >
                        <Title level={4} style={{ marginBottom: '24px', color: '#172b4d' }}>Related templates</Title>
                        <Row gutter={[24, 24]}>
                            {relatedTemplates.map((t: Template) => (
                                <Col key={t.id} xs={24} sm={12} md={8}>
                                    <TemplateCard 
                                        template={{
                                            id: t.id,
                                            title: t.title,
                                            author: t.author || 'Mello',
                                            description: t.description || '',
                                            category: t.category || 'Other',
                                            coverColor: t.cover_color,
                                            copies: t.copies,
                                            views: t.views,
                                        }} 
                                        onClick={() => router.push(`/templates/${t.id}`)} 
                                    />
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>
            )}
        </div>
    );
}
