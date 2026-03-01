import { useEffect, useState } from 'react';
import WebhookManager from './webhook/WebhookManager';
import { useGetPluginSettings, useUpdatePluginSettings, usePluginManifest } from '@/hooks/usePluginSettings';
import { useTranslation } from '@/hooks/useLabels';

import { Modal, Tabs, TextInput, Button, Switch, NumberInput, Select, Alert, Loader, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';

interface PluginSettingsModalProps {
    open: boolean;
    onClose: () => void;
    plugin: any;
    installationId: string;
    boardId: string;
}

export default function PluginSettingsModal({ open, onClose, plugin, installationId, boardId }: PluginSettingsModalProps) {
    const t = useTranslation();

    // Fetch settings values from DB
    const { data: settings, isLoading: isLoadingSettings } = useGetPluginSettings(installationId);

    // Fetch manifest for settings schema
    const { data: manifest, isLoading: isLoadingManifest } = usePluginManifest(plugin?.manifest_url);

    // Mutation to update settings
    const updateSettings = useUpdatePluginSettings();

    // Form state
    const form = useForm({
        initialValues: {},
    });

    // Populate form when settings are loaded
    useEffect(() => {
        if (settings) {
            form.setValues(settings);
        }
    }, [settings]);

    const handleSaveGeneral = async (values: typeof form.values) => {
        try {
            await updateSettings.mutateAsync({
                installationId,
                settings: values
            });
            notifications.show({ message: t('SUCCESS_SETTINGS_UPDATED'), color: 'green' });
        } catch (err) {
            console.error(err);
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_SETTINGS_FAILED'), color: 'red' });
        }
    };

    const renderSettingField = (key: string, config: any) => {
        const label = config.label || key;
        const help = config.description;

        switch (config.type) {
            case 'boolean':
                return (
                    <div style={{ marginBottom: 16 }}>
                        <Switch
                            label={label}
                            description={help}
                            {...form.getInputProps(key, { type: 'checkbox' })}
                        />
                    </div>
                );
            case 'number':
                return (
                    <div style={{ marginBottom: 16 }}>
                        <NumberInput
                            label={label}
                            description={help}
                            {...form.getInputProps(key)}
                        />
                    </div>
                );
            case 'select':
                return (
                    <div style={{ marginBottom: 16 }}>
                        <Select
                            label={label}
                            description={help}
                            data={config.options?.map((opt: string) => ({ label: opt, value: opt })) || []}
                            {...form.getInputProps(key)}
                        />
                    </div>
                );
            case 'string':
            default:
                return (
                    <div style={{ marginBottom: 16 }}>
                        <TextInput
                            label={label}
                            description={help}
                            {...form.getInputProps(key)}
                        />
                    </div>
                );
        }
    };

    const manifestSettings = manifest?.settings || plugin?.version?.manifest?.settings || plugin?.manifest?.settings || {};
    const hasSettings = Object.keys(manifestSettings).length > 0;
    const isLoading = isLoadingSettings || isLoadingManifest;

    return (
        <Modal
            title={`${t('UI_SETTINGS')}: ${plugin.name}`}
            opened={open}
            onClose={onClose}
            size={800}
        >
            <Tabs defaultValue="general">
                <Tabs.List style={{ marginBottom: 16 }}>
                    <Tabs.Tab value="general">{t('UI_GENERAL')}</Tabs.Tab>
                    <Tabs.Tab value="webhooks">{t('UI_WEBHOOKS')}</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="general">
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Loader /></div>
                    ) : !hasSettings ? (
                        <Alert title={t('UI_NO_CONFIG_AVAILABLE')} color="blue" icon={<IconInfoCircle size={16} />}>
                            {t('UI_NO_CONFIG_AVAILABLE')}
                        </Alert>
                    ) : (
                        <form onSubmit={form.onSubmit(handleSaveGeneral)} style={{ marginTop: 20 }}>
                            {Object.entries(manifestSettings).map(([key, config]) => (
                                <div key={key}>
                                    {renderSettingField(key, config)}
                                </div>
                            ))}

                            <div style={{ marginTop: 24, textAlign: 'right' }}>
                                <Button type="submit" loading={updateSettings.isPending}>
                                    {t('UI_SAVE_CHANGES')}
                                </Button>
                            </div>
                        </form>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="webhooks">
                    <WebhookManager
                        pluginId={plugin.id}
                        installationId={installationId}
                    />
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}
