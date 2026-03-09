import { useAppToken } from '@/hooks/useAppToken';
import { useTranslation } from '@/hooks/useLabels';
import { Button, Divider, Text, TextInput } from '@mantine/core';
import { IconCheck, IconTrash } from '@tabler/icons-react';

export const LABEL_COLORS = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
    '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

interface LabelFormProps {
    name: string;
    color: string;
    view: 'create' | 'edit';
    isSubmitting?: boolean;
    onNameChange: (name: string) => void;
    onColorChange: (color: string) => void;
    onSubmit: () => void;
    onDelete?: () => void;
}

export default function LabelForm({
    name,
    color,
    view,
    isSubmitting = false,
    onNameChange,
    onColorChange,
    onSubmit,
    onDelete,
}: LabelFormProps) {
    const t = useTranslation();
    const token = useAppToken();

    return (
        <div>
            {/* Preview Box */}
            <div
                style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    backgroundColor: color,
                    color: token.colorWhite,
                    fontWeight: 500,
                    marginBottom: 16,
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {name || ''}
            </div>

            {/* Title Input */}
            <div style={{ marginBottom: 16 }}>
                <Text fw={500} size="sm" mb={4}>
                    {t('UI_TITLE')}
                </Text>
                <TextInput
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder={t('UI_PLACEHOLDER_LABEL_NAME')}
                    size="sm"
                />
            </div>

            {/* Color Palette */}
            <div style={{ marginBottom: 16 }}>
                <Text fw={500} size="sm" mb={4}>
                    {t('UI_SELECT_COLOR')}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {LABEL_COLORS.map((c) => (
                        <div
                            key={c}
                            onClick={() => onColorChange(c)}
                            style={{
                                width: 48,
                                height: 32,
                                borderRadius: 4,
                                backgroundColor: c,
                                cursor: 'pointer',
                                border: color === c ? `2px solid ${token.colorText}` : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            {color === c && <IconCheck size={16} style={{ color: token.colorWhite }} />}
                        </div>
                    ))}
                </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onSubmit} loading={isSubmitting}>
                    {view === 'create' ? t('UI_CREATE') : t('UI_SAVE')}
                </Button>
                {view === 'edit' && onDelete && (
                    <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={onDelete} loading={isSubmitting}>
                        {t('UI_DELETE')}
                    </Button>
                )}
            </div>
        </div>
    );
}
