'use client';

import React, { useState } from 'react';
import { Button } from 'antd';
import { ScreenHeader } from './MenuShared';
import BackgroundPicker from '../BackgroundPicker';

interface BackgroundScreenProps {
    initialColor: string;
    initialImage: string;
    onBack: () => void;
    onSave: (color: string, image: string) => Promise<void>;
}

export default function BackgroundScreen({ initialColor, initialImage, onBack, onSave }: BackgroundScreenProps) {
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
            <ScreenHeader title="Change background" onBack={onBack} />
            <div style={{ padding: '8px 12px' }}>
                <BackgroundPicker
                    value={selectedColor}
                    onChange={setSelectedColor}
                    imageValue={selectedImage}
                    onImageChange={setSelectedImage}
                />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" size="small" loading={saving} onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
