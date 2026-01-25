'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Typography, Row, Col, Spin, Empty } from 'antd';
import {
    SearchOutlined,
    BankOutlined,
    FormatPainterOutlined,
    ReadOutlined,
    CodeOutlined,
    ShopOutlined,
    ProjectOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import CategoryCard from '@/components/templates/CategoryCard';
import TemplateCard from '@/components/templates/TemplateCard';
import SectionHeader from '@/components/templates/SectionHeader';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/types';

const CATEGORIES = [
    { name: 'Business', icon: BankOutlined, color: '#4bce97' },
    { name: 'Design', icon: FormatPainterOutlined, color: '#e2b203' },
    { name: 'Education', icon: ReadOutlined, color: '#faa53d' },
    { name: 'Engineering', icon: CodeOutlined, color: '#f87462' },
    { name: 'Marketing', icon: ShopOutlined, color: '#9f8fef' },
    { name: 'Project management', icon: ProjectOutlined, color: '#579dff' },
    { name: 'Remote work', icon: GlobalOutlined, color: '#60c6d2' },
];

const { Title } = Typography;

export default function TemplatesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch templates from API
    const { data, isLoading } = useTemplates({ limit: 50 });
    const templates = data?.templates || [];

    // Filter by search term
    const filteredTemplates = searchTerm
        ? templates.filter((t: Template) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : templates;

    // Group templates by category
    const featuredTemplates = filteredTemplates.filter((t: Template) => t.is_featured);
    const businessTemplates = filteredTemplates.filter((t: Template) => t.category === 'Business');
    const designTemplates = filteredTemplates.filter((t: Template) => t.category === 'Design');
    const educationTemplates = filteredTemplates.filter((t: Template) => t.category === 'Education');
    const otherTemplates = filteredTemplates.filter((t: Template) => 
        !t.is_featured && 
        !['Business', 'Design', 'Education'].includes(t.category || '')
    );

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

    const renderTemplateRow = (templateList: Template[], limit: number = 3) => (
        <Row gutter={[24, 24]}>
            {templateList.slice(0, limit).map((template: Template) => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={8}>
                    <TemplateCard 
                        template={toCardFormat(template)} 
                        onClick={() => handleTemplateClick(template.id)} 
                    />
                </Col>
            ))}
        </Row>
    );

    const handleCategoryClick = (category: string) => {
        router.push(`/templates/category/${encodeURIComponent(category.toLowerCase())}`);
    };

    if (isLoading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Only show categories that have templates
    const categoriesWithTemplates = new Set(templates.map((t: Template) => t.category));
    const filteredCategories = CATEGORIES.filter(cat => categoriesWithTemplates.has(cat.name));

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Featured Categories */}
            {filteredCategories.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <Title level={4} style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Featured categories
                    </Title>
                    <Input 
                        prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />} 
                        placeholder="Find templates" 
                        style={{ width: '240px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                    />
                 </div>
                
                <Row gutter={[16, 16]}>
                    {filteredCategories.map((cat) => (
                        <Col key={cat.name} xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}> 
                             <div style={{ cursor: 'pointer' }}>
                                <CategoryCard name={cat.name} icon={cat.icon} color={cat.color} />
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
            )}

            {templates.length === 0 ? (
                <Empty description="No templates available" />
            ) : (
                <>
                    {/* Featured */}
                    {featuredTemplates.length > 0 && (
                        <>
                            <SectionHeader 
                                title="New and notable templates" 
                                icon={<span role="img" aria-label="star">🌟</span>}
                            />
                            {renderTemplateRow(featuredTemplates)}
                        </>
                    )}

                    {/* Business */}
                    {businessTemplates.length > 0 && (
                        <>
                            <SectionHeader 
                                title="Business" 
                                icon={<BankOutlined style={{ color: '#4bce97' }} />}
                                actionLabel={businessTemplates.length > 3 ? "More templates for Business" : undefined}
                                onAction={() => handleCategoryClick('Business')}
                            />
                            {renderTemplateRow(businessTemplates)}
                        </>
                    )}

                    {/* Design */}
                    {designTemplates.length > 0 && (
                        <>
                            <SectionHeader 
                                title="Design" 
                                icon={<FormatPainterOutlined style={{ color: '#e2b203' }} />}
                                actionLabel={designTemplates.length > 3 ? "More templates for Design" : undefined}
                                onAction={() => handleCategoryClick('Design')}
                            />
                            {renderTemplateRow(designTemplates)}
                        </>
                    )}

                    {/* Education */}
                    {educationTemplates.length > 0 && (
                        <>
                            <SectionHeader 
                                title="Education" 
                                icon={<ReadOutlined style={{ color: '#faa53d' }} />}
                                actionLabel={educationTemplates.length > 3 ? "More templates for Education" : undefined}
                                onAction={() => handleCategoryClick('Education')}
                            />
                            {renderTemplateRow(educationTemplates)}
                        </>
                    )}
                    {/* Other */}
                    {otherTemplates.length > 0 && (
                        <>
                            <SectionHeader 
                                title="Other templates" 
                                icon={<span role="img" aria-label="folder">📁</span>}
                            />
                            {renderTemplateRow(otherTemplates)}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
