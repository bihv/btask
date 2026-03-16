'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Paper, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { VerifyTwoFA } from '@/components/auth/TwoFA';
import { useAuthStore } from '@/stores/authStore';

export default function Verify2FAPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const { login, user } = useAuthStore();
    const [error, setError] = useState('');

    if (!email) {
        return (
            <Container size={420} my={40}>
                <Paper withBorder shadow="md" p={30} radius="md">
                    <Alert icon={<IconAlertCircle size={16} />} color="red">
                        Invalid access. Please login first.
                    </Alert>
                </Paper>
            </Container>
        );
    }

    const handleSuccess = () => {
        // Login completed, redirect to dashboard
        router.push('/');
    };

    const handleCancel = () => {
        router.push('/login');
    };

    return (
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md">
                <VerifyTwoFA
                    email={email}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </Paper>
        </Container>
    );
}
