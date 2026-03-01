'use client';

import { useRouter, useParams } from 'next/navigation';
import { useCard } from '@/hooks/useCards';
import BoardPage from '../../page';
import CardModalWrapper from '@/components/card/CardModalWrapper';

import { Loader } from '@mantine/core';
export default function CardPage() {
    const router = useRouter();
    const params = useParams();
    const boardId = params.id as string;
    const cardId = params.cardId as string;

    const { isLoading } = useCard(cardId);

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <>
            {/* Board in background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <BoardPage />
            </div>

            {/* Modal overlay */}
            <CardModalWrapper
                cardId={cardId}
                onClose={() => router.push(`/boards/${boardId}`)}
            />
        </>
    );
}
