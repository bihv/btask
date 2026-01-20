'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Button, Modal, Form, Input, Empty, Row, Col, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CreateBoardRequest, Workspace } from '@/types';
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards';
import BackgroundPicker, { SOLID_COLORS } from '@/components/board/BackgroundPicker';
import BoardCard from '@/components/board/BoardCard';

const { Title, Text } = Typography;

interface WorkspaceBoardsProps {
    workspace: Workspace;
}

export default function WorkspaceBoards({ workspace }: WorkspaceBoardsProps) {
    const router = useRouter();
    const { message } = App.useApp();
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [boardForm] = Form.useForm();
    
    // Watch form values for background picker
    const backgroundColor = Form.useWatch('background_color', boardForm);
    const backgroundImage = Form.useWatch('background_image', boardForm);

    const updateMutation = useUpdateBoard();
    const createBoardMutation = useCreateBoard(workspace.id);

    const toggleStar = (boardId: string, isStarred: boolean) => {
        updateMutation.mutate({ id: boardId, data: { is_starred: !isStarred } });
    };

    const handleCreateBoard = async (values: CreateBoardRequest) => {
        try {
            const newBoard = await createBoardMutation.mutateAsync(values);
            message.success('Board created successfully');
            setCreateBoardModalOpen(false);
            boardForm.resetFields();
            router.push(`/boards/${newBoard.id}`);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create board');
        }
    };

    const boards = workspace.boards || [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Boards</Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => setCreateBoardModalOpen(true)}
                >
                    Create Board
                </Button>
            </div>

            {boards.length === 0 ? (
                <Empty description="No boards in this workspace yet">
                    <Button type="primary" onClick={() => setCreateBoardModalOpen(true)}>
                        Create your first board
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {boards.map((board) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={board.id}>
                            <BoardCard
                                board={board}
                                onClick={() => router.push(`/boards/${board.id}`)}
                                onToggleStar={toggleStar}
                                style={{ minHeight: 100 }}
                            />
                        </Col>
                    ))}
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <div 
                            style={{
                                height: 100,
                                borderRadius: 4,
                                border: '1px dashed var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: 'rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setCreateBoardModalOpen(true)}
                        >
                            <Text type="secondary">Create new board</Text>
                        </div>
                    </Col>
                </Row>
            )}

            <Modal
                title="Create board"
                open={createBoardModalOpen}
                onCancel={() => {
                    setCreateBoardModalOpen(false);
                    boardForm.resetFields();
                }}
                footer={null}
                width={400}
            >
                <Form form={boardForm} layout="vertical" onFinish={handleCreateBoard}>
                    <Form.Item
                        name="title"
                        label="Board title"
                        rules={[{ required: true, message: 'Please enter a board title' }]}
                    >
                        <Input placeholder="Enter board title" autoFocus />
                    </Form.Item>

                    <div style={{ marginBottom: 16 }}>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Background
                        </Typography.Text>
                        <Form.Item name="background_color" noStyle initialValue={SOLID_COLORS[0]}>
                            <Input type="hidden" />
                        </Form.Item>
                        <Form.Item name="background_image" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                        <BackgroundPicker
                            value={backgroundColor || SOLID_COLORS[0]}
                            imageValue={backgroundImage}
                            onChange={(color) => {
                                boardForm.setFieldsValue({
                                    background_color: color,
                                    background_image: '',
                                });
                            }}
                            onImageChange={(url) => {
                                boardForm.setFieldsValue({
                                    background_image: url,
                                    background_color: '',
                                });
                            }}
                        />
                    </div>

                    <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={createBoardMutation.isPending}
                        >
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
