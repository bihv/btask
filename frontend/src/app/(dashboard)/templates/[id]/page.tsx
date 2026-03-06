'use client';

import BoardPreview from '@/components/templates/BoardPreview';
import TemplateCard from '@/components/templates/TemplateCard';
import UseTemplateModal from '@/components/templates/UseTemplateModal';
import { useTranslation } from '@/hooks/useLabels';
import { useTemplate, useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/types';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Anchor, Breadcrumbs, Button, Divider, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconEye, IconShare } from '@tabler/icons-react';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
    ssr: false,
    loading: () => <Loader size="sm" />,
});

export default function TemplateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
    const t = useTranslation();

    const { data: template, isLoading, error } = useTemplate(id);
    const { data: templatesData } = useTemplates({ limit: 4 });

    // Get related templates (exclude current one)
    const relatedTemplates = (templatesData?.templates || [])
        .filter((t: Template) => t.id !== id)
        .slice(0, 3);

    if (isLoading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !template) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <Title order={3}>{t('UI_TEMPLATE_NOT_FOUND')}</Title>
                <Button onClick={() => router.push('/templates')}>
                    {t('UI_BACK_TO_TEMPLATES')}
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
        setShowUseTemplateModal(true);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        notifications.show({ message: t('UI_LINK_COPIED'), color: 'green' });
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
            // Link preview fields
            link_url: card.link_url,
            link_title: card.link_title,
            link_description: card.link_description,
            link_image: card.link_image,
            link_site_name: card.link_site_name,
            link_favicon: card.link_favicon,
        })) || [],
    })) || [];

    return (
        <div style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumbs style={{ marginBottom: '24px' }}>
                <Anchor onClick={() => router.push('/templates')}>{t('UI_TEMPLATE_GALLERY')}</Anchor>
                <Text>{template.category || 'Templates'}</Text>
                <Text>{template.title}</Text>
            </Breadcrumbs>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Template icon */}
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            background: template.cover_url
                                ? `url(${template.cover_url}) center/cover`
                                : template.cover_color || '#206A5D',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {!template.cover_url && (
                            <img src="/mello-icon-only.svg" alt="Mello" style={{ width: '28px', height: '28px', filter: 'brightness(0) invert(1)' }} />
                        )}
                    </div>

                    <div>
                        <Title order={2} style={{ margin: 0, marginBottom: '4px' }}>{template.title}</Title>
                        <Text c="dimmed">{t('UI_CREATED_BY')} {template.author || 'Mello'}</Text>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IconCopy size={16} style={{ color: 'var(--text-secondary)' }} />
                                <Text c="dimmed">{formatNumber(template.copies)} {t('UI_COPIES')}</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IconEye size={16} style={{ color: 'var(--text-secondary)' }} />
                                <Text c="dimmed">{formatNumber((template.views || 0) + 1)} {t('UI_VIEWS')}</Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button leftSection={<IconShare size={16} />} onClick={handleShare}>
                        {t('UI_SHARE')}
                    </Button>
                    <Button onClick={handleUseTemplate}>
                        {t('UI_USE_TEMPLATE')}
                    </Button>
                </div>
            </div>

            {/* About section */}
            <div style={{ marginBottom: '32px' }}>
                <Title order={4} style={{ marginBottom: '16px' }}>{t('UI_ABOUT_THIS_TEMPLATE')}</Title>
                {template.full_description ? (
                    <RichTextEditor
                        content={template.full_description}
                        editable={false}
                    />
                ) : (
                    <Text c="dimmed">{template.description || t('UI_NO_DESCRIPTION')}</Text>
                )}
            </div>

            {/* Board Preview */}
            {previewLists.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <BoardPreview
                        lists={previewLists}
                        title={template.title}
                        backgroundColor={template.cover_color}
                        backgroundImage={template.cover_url}
                    />
                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <Button variant="transparent" style={{ padding: 0 }}>
                            {t('UI_VIEW_TEMPLATE')} →
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
                        <Title order={4} style={{ marginBottom: '24px', color: '#172b4d' }}>{t('UI_RELATED_TEMPLATES')}</Title>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                            {relatedTemplates.map((t: Template) => (
                                <div>
                                    <TemplateCard
                                        template={t}
                                        onClick={() => router.push(`/templates/${t.id}`)}
                                    />
                                </div>
                            ))}
                        </SimpleGrid>
                    </div>
                </div>
            )}

            {/* Use Template Modal */}
            {template && (
                <UseTemplateModal
                    template={template}
                    open={showUseTemplateModal}
                    onClose={() => setShowUseTemplateModal(false)}
                />
            )}
        </div>
    );
}
