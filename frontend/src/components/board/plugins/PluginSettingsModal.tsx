import { Modal, Tabs, Form, Input, Button, App, Switch, InputNumber, Select, Alert, Spin } from 'antd';
import { useEffect } from 'react';
import WebhookManager from './webhook/WebhookManager';
import { useGetPluginSettings, useUpdatePluginSettings, usePluginManifest } from '@/hooks/usePluginSettings';

interface PluginSettingsModalProps {
    open: boolean;
    onClose: () => void;
    plugin: any;
    installationId: string;
    boardId: string;
}

export default function PluginSettingsModal({ open, onClose, plugin, installationId, boardId }: PluginSettingsModalProps) {
    const { message } = App.useApp();
    const [form] = Form.useForm();

    // Fetch settings values from DB
    const { data: settings, isLoading: isLoadingSettings } = useGetPluginSettings(installationId);

    // Fetch manifest for settings schema
    const { data: manifest, isLoading: isLoadingManifest } = usePluginManifest(plugin?.manifest_url);

    // Mutation to update settings
    const updateSettings = useUpdatePluginSettings();

    // Populate form when settings are loaded
    useEffect(() => {
        if (settings) {
            form.setFieldsValue(settings);
        }
    }, [settings, form]);

    const handleSaveGeneral = async (values: any) => {
        try {
            await updateSettings.mutateAsync({
                installationId,
                settings: values
            });
            message.success('Settings updated');
        } catch (err) {
            console.error(err);
            message.error('Failed to update settings');
        }
    };

    const renderSettingField = (key: string, config: any) => {
        const label = config.label || key;
        const help = config.description;

        switch (config.type) {
            case 'boolean':
                return (
                    <Form.Item name={key} label={label} help={help} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                );
            case 'number':
                return (
                    <Form.Item name={key} label={label} help={help}>
                        <InputNumber />
                    </Form.Item>
                );
            case 'select':
                return (
                    <Form.Item name={key} label={label} help={help}>
                        <Select options={config.options?.map((opt: string) => ({ label: opt, value: opt }))} />
                    </Form.Item>
                );
            case 'string':
            default:
                return (
                    <Form.Item name={key} label={label} help={help}>
                        <Input />
                    </Form.Item>
                );
        }
    };

    const manifestSettings = manifest?.settings || plugin?.version?.manifest?.settings || plugin?.manifest?.settings || {};
    const hasSettings = Object.keys(manifestSettings).length > 0;
    const isLoading = isLoadingSettings || isLoadingManifest;

    return (
        <Modal
            title={`Settings: ${plugin.name}`}
            open={open}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            <Tabs defaultActiveKey="general">
                <Tabs.TabPane tab="General" key="general">
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                    ) : !hasSettings ? (
                        <Alert message="No configuration available for this plugin." type="info" showIcon />
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSaveGeneral}
                            initialValues={settings || {}}
                            style={{ marginTop: 20 }}
                        >
                            {Object.entries(manifestSettings).map(([key, config]) => (
                                <div key={key}>
                                    {renderSettingField(key, config)}
                                </div>
                            ))}

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={updateSettings.isPending}>
                                    Save Changes
                                </Button>
                            </Form.Item>
                        </Form>
                    )}
                </Tabs.TabPane>
                <Tabs.TabPane tab="Webhooks" key="webhooks">
                    <WebhookManager
                        pluginId={plugin.id}
                        installationId={installationId}
                    />
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    );
}
