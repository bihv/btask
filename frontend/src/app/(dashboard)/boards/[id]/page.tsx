'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Typography, Button, Input, Spin, message, Dropdown, Modal, Form, ColorPicker } from 'antd';
import {
    StarOutlined,
    StarFilled,
    MoreOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { useBoardStore } from '@/stores/boardStore';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import CardDrawer from '@/components/card/CardDrawer';

const { Text } = Typography;

export default function BoardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const boardId = params.id as string;
    const cardId = searchParams.get('card');

    const { currentBoard, fetchBoard, isLoading } = useBoardStore();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsForm] = Form.useForm();

    useEffect(() => {
        fetchBoard(boardId);
    }, [boardId, fetchBoard]);

    useEffect(() => {
        if (currentBoard) {
            setTitle(currentBoard.title);
        }
    }, [currentBoard]);

    // Find the selected card from all lists
    const selectedCard = useMemo(() => {
        if (!cardId || !currentBoard?.lists) return null;
        for (const list of currentBoard.lists) {
            const card = list.cards?.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    }, [cardId, currentBoard]);

    const handleCloseDrawer = () => {
        // Remove card param from URL
        router.push(`/boards/${boardId}`, { scroll: false });
    };

    const handleTitleSave = async () => {
        if (title.trim() && title !== currentBoard?.title) {
            try {
                await api.put(`/boards/${boardId}`, { title: title.trim() });
                message.success('Board title updated');
            } catch (error) {
                message.error('Failed to update title');
                setTitle(currentBoard?.title || '');
            }
        }
        setIsEditing(false);
    };

    const toggleStar = async () => {
        if (!currentBoard) return;
        try {
            await api.put(`/boards/${boardId}`, {
                is_starred: !currentBoard.is_starred,
            });
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to update board');
        }
    };

    const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'settings') {
            settingsForm.setFieldsValue({
                title: currentBoard?.title,
                description: currentBoard?.description || '',
                background_color: currentBoard?.background_color || '#0079bf',
            });
            setSettingsOpen(true);
        } else if (key === 'delete') {
            Modal.confirm({
                title: 'Delete this board?',
                content: 'This action cannot be undone. All lists and cards will be permanently deleted.',
                okText: 'Delete',
                okType: 'danger',
                onOk: async () => {
                    try {
                        await api.delete(`/boards/${boardId}`);
                        message.success('Board deleted');
                        router.push('/workspaces');
                    } catch (error) {
                        message.error('Failed to delete board');
                    }
                },
            });
        }
    };

    const handleSettingsSave = async () => {
        try {
            const values = await settingsForm.validateFields();
            const bgColor = typeof values.background_color === 'string'
                ? values.background_color
                : values.background_color?.toHexString?.() || values.background_color;

            await api.put(`/boards/${boardId}`, {
                title: values.title,
                description: values.description,
                background_color: bgColor,
            });
            message.success('Board settings updated');
            setSettingsOpen(false);
            fetchBoard(boardId);
        } catch (error) {
            message.error('Failed to update board settings');
        }
    };

    if (isLoading || !currentBoard) {
        return (
            <div className="loading-container" style={{ minHeight: '100%' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: currentBoard.background_color || '#0079bf',
            }}
        >
            {/* Board Header */}
            <div className="board-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
                        style={{ color: 'white' }}
                    />
                    {isEditing ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onPressEnter={handleTitleSave}
                            autoFocus
                            style={{
                                width: 200,
                                fontWeight: 700,
                                fontSize: 18,
                            }}
                        />
                    ) : (
                        <Text
                            className="board-title"
                            onClick={() => setIsEditing(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            {currentBoard.title}
                        </Text>
                    )}
                    <Button
                        type="text"
                        icon={
                            currentBoard.is_starred ? (
                                <StarFilled style={{ color: '#f5cd47' }} />
                            ) : (
                                <StarOutlined style={{ color: 'white' }} />
                            )
                        }
                        onClick={toggleStar}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Dropdown
                        menu={{
                            items: [
                                { key: 'settings', label: 'Board Settings' },
                                { key: 'delete', label: 'Delete Board', danger: true },
                            ],
                            onClick: handleMenuClick,
                        }}
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined style={{ color: 'white' }} />}
                        />
                    </Dropdown>
                </div>
            </div>

            {/* Kanban Board */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <KanbanBoard />
            </div>

            {/* Card Drawer */}
            <CardDrawer
                card={selectedCard}
                open={!!cardId && !!selectedCard}
                onClose={handleCloseDrawer}
            />

            {/* Board Settings Modal */}
            <Modal
                title="Board Settings"
                open={settingsOpen}
                onCancel={() => setSettingsOpen(false)}
                onOk={handleSettingsSave}
                okText="Save"
            >
                <Form
                    form={settingsForm}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="title"
                        label="Board Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="Enter board title" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea
                            placeholder="Add a description for this board"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item
                        name="background_color"
                        label="Background Color"
                    >
                        <ColorPicker
                            showText
                            presets={[
                                {
                                    label: 'Recommended',
                                    colors: [
                                        '#0079bf', '#d29034', '#519839', '#b04632',
                                        '#89609e', '#cd5a91', '#00aecc', '#838c91',
                                    ],
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
