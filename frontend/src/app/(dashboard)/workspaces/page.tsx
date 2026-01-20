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
import { useWorkspaces } from '@/hooks/useWorkspaces';

const { Title, Text, Paragraph } = Typography;

export default function WorkspacesPage() {
    const router = useRouter();
    const { setHeaderContent } = useHeader();
    const { message } = App.useApp();


    // React Query hooks
    const { data: workspaces = [], isLoading } = useWorkspaces();

    // Set dynamic header
    useEffect(() => {
        setHeaderContent(
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Your Workspaces</Title>

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
                    <Button type="primary" disabled>
                        Use the "Create" button in the top bar to start
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


        </div>
    );
}
