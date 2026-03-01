'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryCard from '@/components/templates/CategoryCard';
import TemplateCard from '@/components/templates/TemplateCard';
import SectionHeader from '@/components/templates/SectionHeader';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

import { TextInput, Text, Title, SimpleGrid, Loader, Center } from '@mantine/core';
import { IconSearch, IconBuildingBank, IconBrush, IconBook, IconCode, IconBuildingStore, IconLayoutBoard, IconWorld } from '@tabler/icons-react';
const CATEGORIES = [
    { name: 'Business', icon: IconBuildingBank, color: '#4bce97' },
    { name: 'Design', icon: IconBrush, color: '#e2b203' },
    { name: 'Education', icon: IconBook, color: '#faa53d' },
    { name: 'Engineering', icon: IconCode, color: '#f87462' },
    { name: 'Marketing', icon: IconBuildingStore, color: '#9f8fef' },
    { name: 'Project management', icon: IconLayoutBoard, color: '#579dff' },
    { name: 'Remote work', icon: IconWorld, color: '#60c6d2' },
];

export default function TemplatesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const t = useTranslation();

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
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {templateList.slice(0, limit).map((template: Template) => (
                <div>
                    <TemplateCard
                        template={toCardFormat(template)}
                        onClick={() => handleTemplateClick(template.id)}
                    />
                </div>
            ))}
        </SimpleGrid>
    );

    const handleCategoryClick = (category: string) => {
        router.push(`/templates/category/${encodeURIComponent(category.toLowerCase())}`);
    };

    if (isLoading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Loader size="lg" />
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
                        <Title order={4} style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Featured categories
                        </Title>
                        <TextInput
                            leftSection={<IconSearch size={16} style={{ color: 'var(--text-secondary)' }} />}
                            placeholder={t('UI_FIND_TEMPLATES')}
                            style={{ width: '240px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}

                        />
                    </div>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                        {filteredCategories.map((cat) => (
                            <div>
                                <div style={{ cursor: 'pointer' }}>
                                    <CategoryCard name={cat.name} icon={cat.icon} color={cat.color} />
                                </div>
                            </div>
                        ))}
                    </SimpleGrid>
                </div>
            )}

            {templates.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">{t('UI_NO_TEMPLATES')}</Text>
            ) : (
                <>
                    {/* Featured */}
                    {featuredTemplates.length > 0 && (
                        <>
                            <SectionHeader
                                title={t('UI_NEW_NOTABLE_TEMPLATES')}
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
                                icon={<IconBuildingBank size={16} style={{ color: '#4bce97' }} />}
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
                                icon={<IconBrush size={16} style={{ color: '#e2b203' }} />}
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
                                icon={<IconBook size={16} style={{ color: '#faa53d' }} />}
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
                                title={t('UI_OTHER_TEMPLATES')}
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
