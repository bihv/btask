'use client';

import React, { useState } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import styles from './KanbanBoard.module.css';
import { useTranslation } from '@/hooks/useLabels';

import { Button, TextInput } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
interface AddListProps {
    boardId: string;
}

export default function AddList({ boardId }: AddListProps) {
    const { createList } = useBoardStore();
    const t = useTranslation();
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
                <IconPlus size={16}  />
                {t('UI_ADD_ANOTHER_LIST')}
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
            <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('UI_PLACEHOLDER_LIST_TITLE')}
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
                <Button  onClick={handleAdd}>
                    {t('UI_ADD_LIST')}
                </Button>
                <Button
                    variant="subtle"
                    leftSection={<IconX size={16}  />}
                    onClick={() => {
                        setIsAdding(false);
                        setTitle('');
                    }}
                />
            </div>
        </div>
    );
}
