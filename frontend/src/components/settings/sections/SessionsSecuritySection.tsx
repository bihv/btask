'use client';

import { EnableTwoFAModal } from '@/components/auth/TwoFA';
import { useTranslation } from '@/hooks/useLabels';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Alert, Badge, Button, Card, Checkbox, Divider, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle, IconCopy, IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconKey, IconLogout, IconShieldCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface TwoFAStatus {
    enabled: boolean;
    rememberedDevicesCount: number;
}

interface Device {
    id: string;
    device_name: string;
    ip_address: string;
    created_at: string;
    expires_at: string;
    last_used_at: string;
}

export default function SessionsSecuritySection() {
    const t = useTranslation();
    const { sessions, fetchSessions, revokeSession, revokeAllOtherSessions } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

    // 2FA State
    const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [enableModalOpen, { open: openEnableModal, close: closeEnableModal }] = useDisclosure(false);
    const [disableModalOpen, { open: openDisableModal, close: closeDisableModal }] = useDisclosure(false);
    const [recoveryModalOpen, { open: openRecoveryModal, close: closeRecoveryModal }] = useDisclosure(false);

    useEffect(() => {
        fetchSessions();
        fetchTwoFAStatus();
    }, []);

    const fetchTwoFAStatus = async () => {
        try {
            const response = await api.get('/auth/2fa/status');
            setTwoFAStatus(response.data.data);
            if (response.data.data.enabled) {
                fetchDevices();
            }
        } catch (error) {
            console.error('Failed to fetch 2FA status:', error);
        }
    };

    const fetchDevices = async () => {
        try {
            const response = await api.get('/auth/2fa/devices');
            setDevices(response.data.data);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        }
    };

    const handleEnable2FA = async () => {
        // Just open the modal - it will fetch the data when opened
        openEnableModal();
    };

    const handleDisable2FA = async (password: string) => {
        setTwoFALoading(true);
        try {
            await api.post('/auth/2fa/disable', { password });
            closeDisableModal();
            fetchTwoFAStatus();
        } catch (error) {
            console.error('Failed to disable 2FA:', error);
            throw error;
        }
        setTwoFALoading(false);
    };

    const handleDeleteDevice = async (deviceId: string) => {
        try {
            await api.delete(`/auth/2fa/devices/${deviceId}`);
            fetchDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    };

    const handleDeleteAllDevices = async () => {
        try {
            for (const device of devices) {
                await api.delete(`/auth/2fa/devices/${device.id}`);
            }
            fetchDevices();
        } catch (error) {
            console.error('Failed to delete devices:', error);
        }
    };

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
            {/* 2FA Section */}
            <Card>
                <Group justify="space-between" mb="md">
                    <Group>
                        <IconShieldCheck size={24} />
                        <div>
                            <Text fw={500}>{t('UI_TWO_FACTOR_AUTH')}</Text>
                            <Text size="sm" c="dimmed">{t('UI_TWO_FACTOR_AUTH_DESC')}</Text>
                        </div>
                    </Group>
                    {twoFAStatus?.enabled ? (
                        <Badge color="green" size="lg">Enabled</Badge>
                    ) : (
                        <Badge color="gray" size="lg">Disabled</Badge>
                    )}
                </Group>

                {twoFAStatus?.enabled ? (
                    <Stack gap="md">
                        <Group>
                            <Button
                                variant="light"
                                leftSection={<IconKey size={16} />}
                                onClick={openRecoveryModal}
                            >
                                Generate Recovery Codes
                            </Button>
                            <Button
                                color="red"
                                variant="light"
                                onClick={openDisableModal}
                            >
                                {t('UI_DISABLE_2FA')}
                            </Button>
                        </Group>

                        {devices.length > 0 && (
                            <>
                                <Divider my="sm" />
                                <Text fw={500} mb="xs">{t('UI_REMEMBERED_DEVICES')}</Text>
                                {devices.map((device) => (
                                    <Group key={device.id} justify="space-between" p="sm" style={{ borderRadius: 8 }}>
                                        <div>
                                            <Text size="sm" fw={500}>{device.device_name}</Text>
                                            <Text size="xs" c="dimmed">
                                                {t('UI_LAST_USED')}: {formatDate(device.last_used_at)}
                                            </Text>
                                        </div>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleDeleteDevice(device.id)}
                                        >
                                            {t('UI_REMOVE_DEVICE')}
                                        </Button>
                                    </Group>
                                ))}
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="gray"
                                    onClick={handleDeleteAllDevices}
                                >
                                    {t('UI_REMOVE_ALL_DEVICES')}
                                </Button>
                            </>
                        )}
                    </Stack>
                ) : (
                    <Button
                        onClick={handleEnable2FA}
                        loading={twoFALoading}
                        mt="md"
                    >
                        {t('UI_ENABLE_2FA')}
                    </Button>
                )}
            </Card>

            <Divider my="lg" />

            {/* Sessions Section */}
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

            {/* Disable 2FA Modal */}
            <Modal
                opened={disableModalOpen}
                onClose={closeDisableModal}
                title={t('UI_DISABLE_2FA')}
                centered
            >
                <DisableTwoFAModal onDisable={handleDisable2FA} loading={twoFALoading} />
            </Modal>

            {/* Enable 2FA Modal */}
            {/* Regenerate Recovery Codes Modal */}
            <RegenerateRecoveryCodesModal
                opened={recoveryModalOpen}
                onClose={closeRecoveryModal}
            />

            <EnableTwoFAModal
                opened={enableModalOpen}
                onClose={closeEnableModal}
                onSuccess={() => {
                    closeEnableModal();
                    fetchTwoFAStatus();
                }}
            />
        </>
    );
}

function DisableTwoFAModal({ onDisable, loading }: { onDisable: (password: string) => Promise<void>; loading: boolean }) {
    const t = useTranslation();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSubmitting(true);
        try {
            await onDisable(password);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to disable 2FA');
        }
        setSubmitting(false);
    };

    return (
        <Stack>
            <Text>{t('UI_DISABLE_2FA_CONFIRM')}</Text>
            <Text size="sm" c="dimmed">{t('UI_DISABLE_2FA_WARNING')}</Text>
            <Checkbox
                label={t('UI_DISABLE_2FA_CONFIRM_CHECKBOX')}
                required
            />
            <Text size="sm" fw={500}>{t('UI_ENTER_PASSWORD')}</Text>
            <input
                type="password"
                className="mantine-TextInput-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('UI_PASSWORD')}
            />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => {}}>
                    {t('UI_CANCEL')}
                </Button>
                <Button
                    color="red"
                    onClick={handleSubmit}
                    loading={submitting || loading}
                    disabled={!password}
                >
                    {t('UI_DISABLE_2FA')}
                </Button>
            </Group>
        </Stack>
    );
}

function RegenerateRecoveryCodesModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [confirmedSaved, setConfirmedSaved] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (opened) {
            setPassword('');
            setError('');
            setRecoveryCodes([]);
            setConfirmedSaved(false);
        }
    }, [opened]);

    const handleGenerate = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/2fa/recovery-codes', { password });
            setRecoveryCodes(response.data.data.recoveryCodes);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate recovery codes');
        }
        setLoading(false);
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(recoveryCodes.join('\n'));
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Generate Recovery Codes"
            size="md"
            centered
            closeOnClickOutside={recoveryCodes.length === 0}
        >
            {recoveryCodes.length === 0 ? (
                <Stack>
                    <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                        This will invalidate your existing recovery codes and generate new ones.
                    </Alert>

                    <Text size="sm">Enter your password to confirm:</Text>

                    <PasswordInput
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        autoFocus
                    />

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleGenerate} loading={loading} disabled={!password}>
                            Generate New Codes
                        </Button>
                    </Group>
                </Stack>
            ) : (
                <Stack>
                    <Alert icon={<IconKey size={16} />} color="yellow" variant="light">
                        Save these recovery codes in a safe place. Your previous codes are no longer valid.
                    </Alert>

                    <div style={{
                        background: 'var(--mantine-color-default)',
                        padding: 16,
                        borderRadius: 8,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8
                    }}>
                        {recoveryCodes.map((code, index) => (
                            <Group key={index} justify="space-between" style={{ padding: '4px 8px' }}>
                                <Text size="sm" fw={500} style={{ fontFamily: 'monospace' }}>{code}</Text>
                                <IconCopy
                                    size={14}
                                    style={{ cursor: 'pointer', opacity: 0.6 }}
                                    onClick={() => handleCopyCode(code)}
                                />
                            </Group>
                        ))}
                    </div>

                    <Button variant="light" size="xs" leftSection={<IconCopy size={14} />} onClick={handleCopyAll}>
                        Copy All Codes
                    </Button>

                    <Checkbox
                        label="I have saved these codes in a safe place"
                        checked={confirmedSaved}
                        onChange={(e) => setConfirmedSaved(e.currentTarget.checked)}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button onClick={onClose} disabled={!confirmedSaved}>
                            Done
                        </Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
}
