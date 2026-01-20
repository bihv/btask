'use client';

import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useBoardStore } from '@/stores/boardStore';
import styles from './KanbanBoard.module.css';

interface AddListProps {
    boardId: string;
}

export default function AddList({ boardId }: AddListProps) {
    const { createList } = useBoardStore();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');

    const handleAdd = () => {
        if (title.trim()) {
            createList(boardId, title.trim());
            setTitle('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <div
                className={styles.addListBtn}
                onClick={() => setIsAdding(true)}
            >
                <PlusOutlined />
                Add another list
            </div>
        );
    }

    return (
        <div
            style={{
                minWidth: 272,
                maxWidth: 272,
                background: 'var(--bg-tertiary)',
                borderRadius: 12,
                padding: 8,
            }}
        >
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter list title..."
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleAdd();
                    }
                    if (e.key === 'Escape') {
                        setIsAdding(false);
                        setTitle('');
                    }
                }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Button type="primary" onClick={handleAdd}>
                    Add list
                </Button>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                        setIsAdding(false);
                        setTitle('');
                    }}
                />
            </div>
        </div>
    );
}
