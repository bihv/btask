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
    Breadcrumb,
    ColorPicker,
} from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import api from '@/lib/api';
import { Workspace, Board, CreateBoardRequest } from '@/types';

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

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchWorkspace();
        fetchBoards();
    }, [workspaceId]);

    const fetchWorkspace = async () => {
        try {
            const response = await api.get(`/workspaces/${workspaceId}`);
            setWorkspace(response.data.data);
        } catch (error) {
            message.error('Failed to fetch workspace');
            router.push('/workspaces');
        }
    };

    const fetchBoards = async () => {
        try {
            const response = await api.get(`/workspaces/${workspaceId}/boards`);
            setBoards(response.data.data || []);
        } catch (error) {
            message.error('Failed to fetch boards');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (values: { title: string }) => {
        setCreating(true);
        try {
            await api.post(`/workspaces/${workspaceId}/boards`, {
                title: values.title,
                background_color: selectedColor,
            });
            message.success('Board created successfully');
            setModalOpen(false);
            form.resetFields();
            setSelectedColor(BOARD_COLORS[0]);
            fetchBoards();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        } finally {
            setCreating(false);
        }
    };

    const toggleStar = async (boardId: string, isStarred: boolean) => {
        try {
            await api.put(`/boards/${boardId}`, { is_starred: !isStarred });
            setBoards((prev) =>
                prev.map((b) =>
                    b.id === boardId ? { ...b, is_starred: !isStarred } : b
                )
            );
        } catch (error) {
            message.error('Failed to update board');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Breadcrumb
                items={[
                    {
                        href: '/workspaces',
                        title: (
                            <>
                                <HomeOutlined />
                                <span>Workspaces</span>
                            </>
                        ),
                    },
                    {
                        title: workspace?.name,
                    },
                ]}
                style={{ marginBottom: 16 }}
            />

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    {workspace?.name}
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                >
                    Create Board
                </Button>
            </div>

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
                        <Button type="primary" htmlType="submit" loading={creating}>
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
