'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Modal,
    Form,
    Input,
    message,
    Empty,
    Spin,
} from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { useHeader } from '@/providers/HeaderProvider';
import { useWorkspace } from '@/hooks/useWorkspaces';
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards';

const { Title, Text } = Typography;

const BOARD_COLORS = [
    '#0079bf',
    '#d29034',
    '#519839',
    '#b04632',
    '#89609e',
    '#cd5a91',
    '#4bbf6b',
    '#00aecc',
    '#838c91',
];

export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.id as string;
    const { setHeaderContent } = useHeader();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);
    const [form] = Form.useForm();

    // React Query hooks - workspace already includes boards
    const { data: workspace, isLoading } = useWorkspace(workspaceId);
    const boards = workspace?.boards || [];
    const createMutation = useCreateBoard(workspaceId);
    const updateMutation = useUpdateBoard();

    const handleCreateBoard = async (values: { title: string }) => {
        try {
            await createMutation.mutateAsync({
                title: values.title,
                background_color: selectedColor,
            });
            message.success('Board created successfully');
            setModalOpen(false);
            form.resetFields();
            setSelectedColor(BOARD_COLORS[0]);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        }
    };

    const toggleStar = (boardId: string, isStarred: boolean) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: !isStarred } });
    };

    // Set dynamic header
    useEffect(() => {
        if (workspace) {
            setHeaderContent(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push('/workspaces')}
                        />
                        <Title level={4} style={{ margin: 0 }}>{workspace.name}</Title>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalOpen(true)}
                    >
                        Create Board
                    </Button>
                </div>
            );
        }
        return () => setHeaderContent(null);
    }, [workspace]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {boards.length === 0 ? (
                <Empty description="No boards yet" style={{ marginTop: 48 }}>
                    <Button type="primary" onClick={() => setModalOpen(true)}>
                        Create your first board
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {boards.map((board) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={board.id}>
                            <Card
                                hoverable
                                style={{
                                    background: board.background_color,
                                    minHeight: 100,
                                    position: 'relative',
                                }}
                                styles={{
                                    body: { padding: 12 },
                                }}
                                onClick={() => router.push(`/boards/${board.id}`)}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Text
                                        strong
                                        style={{ color: 'white', fontSize: 16 }}
                                    >
                                        {board.title}
                                    </Text>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={
                                            board.is_starred ? (
                                                <StarFilled style={{ color: '#f5cd47' }} />
                                            ) : (
                                                <StarOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
                                            )
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStar(board.id, board.is_starred);
                                        }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Create Board"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateBoard}>
                    <div
                        style={{
                            height: 100,
                            borderRadius: 8,
                            marginBottom: 16,
                            background: selectedColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
                            Preview
                        </Text>
                    </div>

                    <Form.Item
                        name="title"
                        label="Board Title"
                        rules={[{ required: true, message: 'Please enter a board title' }]}
                    >
                        <Input placeholder="e.g., Project Alpha" />
                    </Form.Item>

                    <Form.Item label="Background Color">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {BOARD_COLORS.map((color) => (
                                <div
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 4,
                                        background: color,
                                        cursor: 'pointer',
                                        border:
                                            selectedColor === color
                                                ? '2px solid #0052cc'
                                                : '2px solid transparent',
                                    }}
                                />
                            ))}
                        </div>
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
