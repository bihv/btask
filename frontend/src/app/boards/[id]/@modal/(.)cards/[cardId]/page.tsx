'use client';

import { useRouter, useParams } from 'next/navigation';
import CardModalWrapper from '@/components/card/CardModalWrapper';

export default function CardModal() {
    const router = useRouter();
    const params = useParams();
    const cardId = params.cardId as string;

    return (
        <CardModalWrapper
            cardId={cardId}
            onClose={() => router.back()}
        />
    );
}
