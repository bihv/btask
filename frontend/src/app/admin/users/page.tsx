'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAdminUsers, useUpdateUserRole, AdminUser } from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';

import { Switch, Text, Title, Card, Loader, Badge, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const t = useTranslation();

    const { data: users = [], isLoading } = useAdminUsers();
    const updateRole = useUpdateUserRole();

    useEffect(() => {
        if (!user?.is_admin) {
            router.push('/');
        }
    }, [user, router]);

    const handleRoleChange = async (userId: string, isAdmin: boolean) => {
        try {
            await updateRole.mutateAsync({ userId, isAdmin });
            notifications.show({ message: t('UI_USER_ROLE_UPDATED'), color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: t('ERROR_UPDATE_ROLE'), color: 'red' });
        }
    };

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title order={2}>User Management</Title>
            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_EMAIL')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_NAME')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{t('UI_ROLE')}</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Admin</th>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(users as AdminUser[]).map((record) => (
                                    <tr key={record.id}>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{record.email}</td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>{record.full_name}</td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            {record.is_admin ? <Badge color="blue">Admin</Badge> : <Badge>User</Badge>}
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            <Switch
                                                checked={record.is_admin}
                                                onChange={(e) => handleRoleChange(record.id, e.currentTarget.checked)}
                                                disabled={record.id === user?.id || updateRole.isPending}
                                            />
                                        </td>
                                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                            {new Date(record.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
}
