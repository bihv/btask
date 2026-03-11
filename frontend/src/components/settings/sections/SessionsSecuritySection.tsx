'use client';

import { useTranslation } from '@/hooks/useLabels';
import { useAuthStore } from '@/stores/authStore';
import { Badge, Button, Card, Divider, Group, Text, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconLogout } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function SessionsSecuritySection() {
    const t = useTranslation();
    const { sessions, fetchSessions, revokeSession, revokeAllOtherSessions } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        setLoading(true);
        try {
            await revokeSession(sessionId);
        } catch (error) {
            console.error('Failed to revoke session:', error);
        }
        setLoading(false);
    };

    const handleRevokeAll = async () => {
        setLoading(true);
        try {
            await revokeAllOtherSessions();
            closeConfirm();
            window.location.href = '/login';
        } catch (error) {
            console.error('Failed to revoke all sessions:', error);
        }
        setLoading(false);
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <IconDeviceMobile size={20} />;
            case 'tablet':
                return <IconDeviceTablet size={20} />;
            default:
                return <IconDeviceDesktop size={20} />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Card>
                <Text style={{ marginTop: 0, display: 'block', marginBottom: 16 }}>
                    {t('UI_ACTIVE_SESSIONS')}
                </Text>
                <Text c="dimmed" style={{ marginBottom: 16 }}>{t('UI_ACTIVE_SESSIONS_DESC')}</Text>
                
                {sessions.length === 0 ? (
                    <Text c="dimmed" ta="center" py="lg">No active sessions</Text>
                ) : (
                    sessions.map((session) => (
                        <Group key={session.id} justify="space-between" p="sm" style={{ background: session.is_current ? '#f0f9ff' : 'transparent', borderRadius: 8, marginBottom: 8 }}>
                            <Group>
                                {getDeviceIcon(session.device_type)}
                                <div>
                                    <Text size="sm" fw={500}>{session.device_name}</Text>
                                    <Text size="xs" c="dimmed">{session.ip_address} · {formatDate(session.last_active_at)}</Text>
                                </div>
                            </Group>
                            <Group>
                                {session.is_current && <Badge color="green">Current</Badge>}
                                {!session.is_current && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        leftSection={<IconLogout size={14} />}
                                        onClick={() => handleRevokeSession(session.id)}
                                        loading={loading}
                                    >
                                        {t('UI_LOGOUT')}
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    ))
                )}
            </Card>

            <Divider my="lg" />

            <Card>
                <Text style={{ marginTop: 0, display: 'block', marginBottom: 8 }}>{t('UI_LOGOUT_ALL_DEVICES')}</Text>
                <Text c="dimmed" style={{ marginBottom: 12 }}>{t('UI_LOGOUT_ALL_DEVICES_DESC')}</Text>
                <Button
                    color="red"
                    onClick={openConfirm}
                    disabled={sessions.length <= 1}
                >
                    {t('UI_LOGOUT_EVERYWHERE')}
                </Button>
            </Card>

            <Modal
                opened={confirmOpen}
                onClose={closeConfirm}
                title={t('UI_CONFIRM_LOGOUT_ALL')}
                centered
            >
                <Text mb="lg">{t('UI_CONFIRM_LOGOUT_ALL_DESC')}</Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeConfirm}>
                        {t('UI_CANCEL')}
                    </Button>
                    <Button color="red" onClick={handleRevokeAll} loading={loading}>
                        {t('UI_LOGOUT_EVERYWHERE')}
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
