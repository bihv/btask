'use client';

import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ActionIcon, Alert, Badge, Button, Card, CloseButton, Group, Loader, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconShieldCheck } from '@tabler/icons-react';
export default function SecuritySettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const { data: settings, isLoading } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const t = useTranslation();

    // File types state
    const [allowedPrefixes, setAllowedPrefixes] = useState<string[]>([]);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [blockedTypes, setBlockedTypes] = useState<string[]>([]);

    // Input states
    const [inputPrefix, setInputPrefix] = useState('');
    const [inputType, setInputType] = useState('');
    const [inputBlocked, setInputBlocked] = useState('');

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (settings) {
            // Initialize file types state
            setAllowedPrefixes(settings.allowed_file_types?.allowed_prefixes || []);
            setAllowedTypes(settings.allowed_file_types?.allowed_types || []);
            setBlockedTypes(settings.allowed_file_types?.blocked_types || []);
        }
    }, [settings]);

    const handleSubmit = async () => {
        try {
            await updateSettings.mutateAsync({
                allowed_file_types: {
                    allowed_prefixes: allowedPrefixes,
                    allowed_types: allowedTypes,
                    blocked_types: blockedTypes,
                },
            });
            notifications.show({ message: t('UI_SECURITY_SAVED'), color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_SAVE_SETTINGS'), color: 'red' });
        }
    };

    // Tag input handlers
    const handleAddPrefix = () => {
        const value = inputPrefix.trim();
        if (value && !allowedPrefixes.includes(value)) {
            setAllowedPrefixes([...allowedPrefixes, value]);
        }
        setInputPrefix('');
    };

    const handleAddType = () => {
        const value = inputType.trim();
        if (value && !allowedTypes.includes(value)) {
            setAllowedTypes([...allowedTypes, value]);
        }
        setInputType('');
    };

    const handleAddBlocked = () => {
        const value = inputBlocked.trim();
        if (value && !blockedTypes.includes(value)) {
            setBlockedTypes([...blockedTypes, value]);
        }
        setInputBlocked('');
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title order={2} style={{ marginBottom: 24 }}>
                <IconShieldCheck size={24} style={{ marginRight: 8 }} />
                {t('UI_FILE_SECURITY_TITLE')}
            </Title>

            <Text c="dimmed" style={{ display: 'block', marginBottom: 24 }}>
                {t('UI_FILE_SECURITY_DESC')}
            </Text>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader size="lg" />
                </div>
            ) : (
                <Card title={t('UI_ALLOWED_FILE_TYPES')}>
                    <form

                        onSubmit={handleSubmit}
                    >
                        <Alert
                            title="File Type Logic"
                            color="blue"
                            style={{ marginBottom: 24 }}
                        >
                            Prefixes match any type starting with that pattern (e.g., &apos;image/&apos;). Blocked types override checking.
                        </Alert>

                        <div>
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                                {allowedPrefixes.length === 0 && <Text c="dimmed" style={{ fontSize: 13 }}>No prefixes allowed</Text>}
                                <Group wrap="wrap">
                                    {allowedPrefixes.map((prefix) => (
                                        <Badge
                                            key={prefix}
                                            color="blue"
                                            rightSection={
                                                <CloseButton size="xs" variant="transparent" c="white" onClick={() => setAllowedPrefixes(allowedPrefixes.filter((p) => p !== prefix))} />
                                            }
                                        >
                                            {prefix}
                                        </Badge>
                                    ))}
                                </Group>
                            </div>
                            <Group gap="xs">
                                <TextInput
                                    placeholder="Add prefix (e.g., image/)"
                                    value={inputPrefix}
                                    onChange={(e) => setInputPrefix(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrefix())}
                                    style={{ width: 250 }}
                                />
                                <ActionIcon variant="filled" onClick={handleAddPrefix}>
                                    <IconPlus size={16} />
                                </ActionIcon>
                            </Group>
                        </div>

                        <div>
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 150, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                                {allowedTypes.length === 0 && <Text c="dimmed" style={{ fontSize: 13 }}>No specific types allowed</Text>}
                                <Group wrap="wrap">
                                    {allowedTypes.map((type) => (
                                        <Badge
                                            key={type}
                                            color="green"
                                            rightSection={
                                                <CloseButton size="xs" variant="transparent" c="white" onClick={() => setAllowedTypes(allowedTypes.filter((t) => t !== type))} />
                                            }
                                        >
                                            {type}
                                        </Badge>
                                    ))}
                                </Group>
                            </div>
                            <Group gap="xs">
                                <TextInput
                                    placeholder="Add MIME type (e.g., application/pdf)"
                                    value={inputType}
                                    onChange={(e) => setInputType(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddType())}
                                    style={{ width: 300 }}
                                />
                                <ActionIcon variant="filled" onClick={handleAddType}>
                                    <IconPlus size={16} />
                                </ActionIcon>
                            </Group>
                        </div>

                        <div>
                            <div style={{ border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', marginBottom: 8, maxHeight: 120, overflowY: 'auto', background: '#fff1f0' }}>
                                {blockedTypes.length === 0 && <Text c="dimmed" style={{ fontSize: 13 }}>No types blocked</Text>}
                                <Group wrap="wrap">
                                    {blockedTypes.map((type) => (
                                        <Badge
                                            key={type}
                                            color="red"
                                            rightSection={
                                                <CloseButton size="xs" variant="transparent" c="white" onClick={() => setBlockedTypes(blockedTypes.filter((t) => t !== type))} />
                                            }
                                        >
                                            {type}
                                        </Badge>
                                    ))}
                                </Group>
                            </div>
                            <Group gap="xs">
                                <TextInput
                                    placeholder="Block MIME type (e.g., image/svg+xml)"
                                    value={inputBlocked}
                                    onChange={(e) => setInputBlocked(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocked())}
                                    style={{ width: 300 }}
                                />
                                <ActionIcon variant="filled" onClick={handleAddBlocked}>
                                    <IconPlus size={16} />
                                </ActionIcon>
                            </Group>
                        </div>

                        <div>
                            <Button

                                type="submit"
                                loading={updateSettings.isPending}
                            >
                                {t('UI_SAVE_SECURITY_SETTINGS')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </>
    );
}
