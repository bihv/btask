'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/types';
import TemplateCard from '@/components/templates/TemplateCard';
import { useTranslation } from '@/hooks/useLabels';

import { Text, Title, SimpleGrid, Loader, Center, Button, Breadcrumbs, Anchor } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const t = useTranslation();

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
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumbs style={{ marginBottom: '24px' }}>
                <Anchor onClick={() => router.push('/templates')}>Templates</Anchor>
                <Text>{categoryName}</Text>
            </Breadcrumbs>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Button
                    variant="subtle"
                    leftSection={<IconChevronLeft size={16} />}
                    onClick={() => router.push('/templates')}
                    style={{ marginBottom: '16px', padding: 0 }}
                >
                    {t('UI_BACK_TO_TEMPLATES')}
                </Button>
                <Title order={2} style={{ margin: 0 }}>{categoryName} Templates</Title>
                <Text c="dimmed">{templates.length} template{templates.length !== 1 ? 's' : ''} available</Text>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <Center py={48}>
                    <Text c="dimmed">{`No templates found for ${categoryName}`}</Text>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {templates.map((template: Template) => (
                        <div>
                            <TemplateCard
                                template={toCardFormat(template)}
                                onClick={() => handleTemplateClick(template.id)}
                            />
                        </div>
                    ))}
                </SimpleGrid>
            )}
        </div>
    );
}
