'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Switch, Typography, Card, Spin, Tag, App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useAdminUsers, useUpdateUserRole, AdminUser } from '@/hooks/useAdmin';
import { useTranslation } from '@/hooks/useLabels';

const { Title } = Typography;

export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { message } = App.useApp();
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
            message.success(t('UI_USER_ROLE_UPDATED'));
        } catch {
            message.error(t('ERROR_UPDATE_ROLE'));
        }
    };

    const columns = [
        {
            title: t('UI_EMAIL'),
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: t('UI_NAME'),
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: t('UI_ROLE'),
            key: 'role',
            render: (_: unknown, record: AdminUser) => (
                record.is_admin ? <Tag color="blue">Admin</Tag> : <Tag>User</Tag>
            ),
        },
        {
            title: 'Admin',
            key: 'is_admin',
            render: (_: unknown, record: AdminUser) => (
                <Switch
                    checked={record.is_admin}
                    onChange={(checked) => handleRoleChange(record.id, checked)}
                    disabled={record.id === user?.id || updateRole.isPending}
                />
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
    ];

    if (!user?.is_admin) {
        return null;
    }

    return (
        <>
            <Title level={2}>User Management</Title>
            <Card>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 20 }}
                    />
                )}
            </Card>
        </>
    );
}
