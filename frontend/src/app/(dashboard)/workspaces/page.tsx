'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Modal,
    Form,
    Input,
    Empty,
    Spin,
    App,
} from 'antd';
import { PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import { CreateWorkspaceRequest } from '@/types';
import { useHeader } from '@/providers/HeaderProvider';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/useWorkspaces';

const { Title, Text, Paragraph } = Typography;

export default function WorkspacesPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();
    const [modalOpen, setModalOpen] = useState(false);
    const { message } = App.useApp();
    const [form] = Form.useForm();

    // React Query hooks
    const { data: workspaces = [], isLoading } = useWorkspaces();
    const createMutation = useCreateWorkspace();

    const handleCreate = async (values: CreateWorkspaceRequest) => {
        try {
            await createMutation.mutateAsync(values);
            message.success('Workspace created successfully');
            setModalOpen(false);
            form.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create workspace');
        }
    };

    // Set dynamic header
    useEffect(() => {
        setHeaderContent(
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Your Workspaces</Title>
                {workspaces.length > 0 && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalOpen(true)}
                    >
                        Create Workspace
                    </Button>
                )}
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent, workspaces.length]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {workspaces.length === 0 ? (
                <Empty
                    description="No workspaces yet"
                    style={{ marginTop: 48 }}
                >
                    <Button type="primary" onClick={() => setModalOpen(true)}>
                        Create your first workspace
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {workspaces.map((workspace) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={workspace.id}>
                            <Card
                                hoverable
                                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                                style={{ height: '100%' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: 18,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {workspace.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ fontSize: 16 }}>
                                            {workspace.name}
                                        </Text>
                                    </div>
                                </div>
                                {workspace.description && (
                                    <Paragraph
                                        type="secondary"
                                        ellipsis={{ rows: 2 }}
                                        style={{ margin: 0 }}
                                    >
                                        {workspace.description}
                                    </Paragraph>
                                )}
                                <div style={{ marginTop: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <ProjectOutlined /> {workspace.board_count ?? 0} boards
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Create Workspace"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item
                        name="name"
                        label="Workspace Name"
                        rules={[{ required: true, message: 'Please enter a workspace name' }]}
                    >
                        <Input placeholder="e.g., My Team" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            placeholder="Optional description"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button onClick={() => setModalOpen(false)} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
