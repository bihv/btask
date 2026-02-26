'use client';

import { Typography, Form, Input, Button, Divider, Popconfirm, App } from 'antd';
import { Workspace } from '@/types';
import { useTranslation } from '@/hooks/useLabels';

const { Title, Text, Paragraph } = Typography;

interface WorkspaceSettingsProps {
    workspace: Workspace;
}

export default function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const { message } = App.useApp();
    const t = useTranslation();
    const [form] = Form.useForm();

    const handleUpdate = (values: any) => {
        console.log('Update workspace:', values);
        message.info(t('UI_COMING_SOON'));
    };

    const handleDelete = () => {
        console.log('Delete workspace:', workspace.id);
        message.info(t('UI_COMING_SOON'));
    };

    return (
        <div>
            <Title level={4} style={{ marginBottom: 24 }}>{t('UI_WORKSPACE_SETTINGS')}</Title>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    name: workspace.name,
                    description: workspace.description
                }}
                onFinish={handleUpdate}
            >
                <Form.Item
                    name="name"
                    label={t('UI_WORKSPACE_NAME')}
                    rules={[{ required: true, message: t('VALIDATE_WORKSPACE_NAME') }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="description"
                    label={t('UI_DESCRIPTION')}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        {t('UI_SAVE_CHANGES')}
                    </Button>
                </Form.Item>
            </Form>

            <Divider />

            <div style={{ padding: '16px', border: '1px solid red', borderRadius: '8px' }}>
                <Title level={5} type="danger">{t('UI_DANGER_ZONE')}</Title>
                <Paragraph>
                    {t('UI_DELETE_WORKSPACE_DESC')}
                </Paragraph>
                <Popconfirm
                    title={t('UI_DELETE_WORKSPACE')}
                    description={t('UI_CONFIRM_DELETE_WORKSPACE')}
                    onConfirm={handleDelete}
                    okText={t('UI_YES_DELETE')}
                    cancelText={t('UI_CANCEL')}
                    okButtonProps={{ danger: true }}
                >
                    <Button danger>{t('UI_DELETE_WORKSPACE')}</Button>
                </Popconfirm>
            </div>
        </div>
    );
}
