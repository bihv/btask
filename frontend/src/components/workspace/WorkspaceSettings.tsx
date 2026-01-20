'use client';

import { Typography, Form, Input, Button, Divider, Popconfirm, App } from 'antd';
import { Workspace } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface WorkspaceSettingsProps {
    workspace: Workspace;
}

export default function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const handleUpdate = (values: any) => {
        console.log('Update workspace:', values);
        message.info('Update functionality coming soon');
    };

    const handleDelete = () => {
         console.log('Delete workspace:', workspace.id);
         message.info('Delete functionality coming soon');
    };

    return (
        <div>
            <Title level={4} style={{ marginBottom: 24 }}>Workspace Settings</Title>

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
                    label="Workspace Name"
                    rules={[{ required: true, message: 'Please enter workspace name' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Save Changes
                    </Button>
                </Form.Item>
            </Form>

            <Divider />

            <div style={{ padding: '16px', border: '1px solid red', borderRadius: '8px' }}>
                <Title level={5} type="danger">Danger Zone</Title>
                <Paragraph>
                    Deleting this workspace cannot be undone. All boards and content within it will be lost.
                </Paragraph>
                <Popconfirm
                    title="Delete workspace"
                    description="Are you sure you want to delete this workspace?"
                    onConfirm={handleDelete}
                    okText="Yes, delete it"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <Button danger>Delete Workspace</Button>
                </Popconfirm>
            </div>
        </div>
    );
}
