'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useState } from 'react';
import BackgroundPicker from '../BackgroundPicker';
import { ScreenHeader } from './MenuShared';

import { Button } from '@mantine/core';
interface BackgroundScreenProps {
    initialColor: string;
    initialImage: string;
    onBack: () => void;
    onSave: (color: string, image: string) => Promise<void>;
}

export default function BackgroundScreen({ initialColor, initialImage, onBack, onSave }: BackgroundScreenProps) {
    const t = useTranslation();
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [selectedImage, setSelectedImage] = useState(initialImage);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(selectedImage ? '' : selectedColor, selectedImage);
            onBack();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: 280 }}>
            <ScreenHeader title={t('UI_CHANGE_BACKGROUND')} onBack={onBack} />
            <div style={{ padding: '8px 12px' }}>
                <BackgroundPicker
                    value={selectedColor}
                    onChange={setSelectedColor}
                    imageValue={selectedImage}
                    onImageChange={setSelectedImage}
                />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button  size="sm" loading={saving} onClick={handleSave}>
                        {t('UI_SAVE')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
