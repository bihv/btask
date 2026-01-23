'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Typography, Row, Col, Spin, Empty, Button, Breadcrumb } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTemplates, Template } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';

const { Title, Text } = Typography;

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    
    // Decode and format category name
    const categoryName = decodeURIComponent(slug).split('-').map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Fetch templates filtered by category
    const { data, isLoading } = useTemplates({ category: categoryName });
    const templates = data?.templates || [];

    const handleTemplateClick = (templateId: string) => {
        router.push(`/templates/${templateId}`);
    };

    // Convert API template to TemplateCard format
    const toCardFormat = (t: Template) => ({
        id: t.id,
        title: t.title,
        author: t.author || 'Mello',
        description: t.description || '',
        category: t.category || 'Other',
        coverColor: t.cover_color,
        coverUrl: t.cover_url,
        copies: t.copies,
        views: t.views,
    });

    if (isLoading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumb
                style={{ marginBottom: '24px' }}
                items={[
                    { title: <a onClick={() => router.push('/templates')}>Templates</a> },
                    { title: categoryName },
                ]}
            />

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Button 
                    type="text" 
                    icon={<LeftOutlined />} 
                    onClick={() => router.push('/templates')}
                    style={{ marginBottom: '16px', padding: 0 }}
                >
                    Back to Templates
                </Button>
                <Title level={2} style={{ margin: 0 }}>{categoryName} Templates</Title>
                <Text type="secondary">{templates.length} template{templates.length !== 1 ? 's' : ''} available</Text>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <Empty description={`No templates found for ${categoryName}`} />
            ) : (
                <Row gutter={[24, 24]}>
                    {templates.map((template: Template) => (
                        <Col key={template.id} xs={24} sm={12} md={8} lg={8}>
                            <TemplateCard 
                                template={toCardFormat(template)} 
                                onClick={() => handleTemplateClick(template.id)} 
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}
