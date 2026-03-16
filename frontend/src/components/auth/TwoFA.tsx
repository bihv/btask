'use client';

import { useState, useEffect } from 'react';
import { Modal, Stepper, Button, Group, Text, Stack, PinInput, TextInput, Checkbox, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { getDeviceFingerprint, getDeviceName } from '@/lib/fingerprint';
import { IconShieldCheck, IconKey, IconAlertCircle, IconCopy } from '@tabler/icons-react';

interface EnableTwoFAModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EnableTwoFAModal({ opened, onClose, onSuccess }: EnableTwoFAModalProps) {
    const [active, setActive] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Setup data
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [secret, setSecret] = useState('');

    // Step 2: Verification
    const [code, setCode] = useState('');

    // Step 3: Recovery codes
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [confirmedSaved, setConfirmedSaved] = useState(false);

    useEffect(() => {
        if (opened) {
            fetchSetup();
            setActive(0);
            setError('');
            setConfirmedSaved(false);
        }
    }, [opened]);

    const fetchSetup = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/2fa/setup');
            const data = response.data.data;
            setOtpauthUrl(data.otpauthUrl);
            setSecret(data.secret);
        } catch (err) {
            console.error('Failed to fetch 2FA setup:', err);
            setError('Failed to load 2FA setup');
        }
        setLoading(false);
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/2fa/setup', { code, secret });
            const data = response.data.data;
            setRecoveryCodes(data.recoveryCodes);
            setActive(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code. Please try again.');
        }
        setLoading(false);
    };

    const handleCopyCode = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleDone = () => {
        onSuccess();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Enable Two-Factor Authentication"
            size="md"
            centered
        >
            <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
                {/* Step 1: Scan QR Code */}
                <Stepper.Step label="Scan QR Code" description="Setup authenticator">
                    <Stack align="center" mt="md">
                        <Text size="sm" c="dimmed" ta="center">
                            Scan this QR code with your authenticator app
                        </Text>

                        {otpauthUrl && (
                            <div style={{ padding: 16, background: 'white', borderRadius: 8 }}>
                                <QRCodeSVG value={otpauthUrl} size={200} />
                            </div>
                        )}

                        <Text size="sm" fw={500}>Or enter this code manually:</Text>
                        <TextInput
                            value={secret}
                            readOnly
                            style={{ width: '100%', maxWidth: 280 }}
                            rightSection={
                                <IconCopy
                                    size={16}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleCopyCode(secret)}
                                />
                            }
                        />

                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={onClose}>Cancel</Button>
                            <Button onClick={() => setActive(1)} disabled={!secret}>Next</Button>
                        </Group>
                    </Stack>
                </Stepper.Step>

                {/* Step 2: Verify Code */}
                <Stepper.Step label="Verify" description="Enter code">
                    <Stack align="center" mt="md">
                        <Text size="sm" c="dimmed" ta="center">
                            Enter the 6-digit code from your authenticator app
                        </Text>

                        <PinInput
                            length={6}
                            type="number"
                            inputMode="numeric"
                            autoFocus
                            value={code}
                            onChange={setCode}
                            error={!!error}
                            size="lg"
                            style={{ marginTop: 16 }}
                        />

                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={() => setActive(0)}>Back</Button>
                            <Button onClick={handleVerify} loading={loading} disabled={code.length !== 6}>
                                Verify
                            </Button>
                        </Group>
                    </Stack>
                </Stepper.Step>

                {/* Step 3: Recovery Codes */}
                <Stepper.Step label="Recovery Codes" description="Save codes">
                    <Stack mt="md">
                        <Alert icon={<IconKey size={16} />} color="yellow" variant="light">
                            Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
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

                        <Checkbox
                            label="I have saved these codes in a safe place"
                            checked={confirmedSaved}
                            onChange={(e) => setConfirmedSaved(e.currentTarget.checked)}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button onClick={handleDone} disabled={!confirmedSaved}>
                                Done
                            </Button>
                        </Group>
                    </Stack>
                </Stepper.Step>
            </Stepper>
        </Modal>
    );
}

interface VerifyTwoFAProps {
    email: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function VerifyTwoFA({ email, onSuccess, onCancel }: VerifyTwoFAProps) {
    const [code, setCode] = useState('');
    const [rememberDevice, setRememberDevice] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showRecoveryInput, setShowRecoveryInput] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const fingerprint = await getDeviceFingerprint();
            const deviceName = getDeviceName();

            const response = await api.post('/auth/2fa/verify', {
                code,
                rememberDevice,
                fingerprint,
                deviceName,
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code. Please try again.');
        }
        setLoading(false);
    };

    const handleRecoveryVerify = async () => {
        if (!recoveryCode.trim()) {
            setError('Please enter a recovery code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const fingerprint = await getDeviceFingerprint();
            const deviceName = getDeviceName();

            const response = await api.post('/auth/2fa/verify', {
                code: recoveryCode,
                rememberDevice,
                fingerprint,
                deviceName,
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid recovery code.');
        }
        setLoading(false);
    };

    return (
        <Stack align="center" style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
            <IconShieldCheck size={48} color="#228be6" />
            <Text size="xl" fw={600}>Two-Factor Authentication</Text>
            <Text size="sm" c="dimmed" ta="center">
                Enter the 6-digit code from your authenticator app
            </Text>

            {!showRecoveryInput ? (
                <>
                    <PinInput
                        length={6}
                        type="number"
                        inputMode="numeric"
                        autoFocus
                        value={code}
                        onChange={setCode}
                        error={!!error}
                        size="lg"
                        style={{ marginTop: 16 }}
                    />

                    <Checkbox
                        label="Remember this device for 30 days"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.currentTarget.checked)}
                        style={{ width: '100%' }}
                    />

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        onClick={handleVerify}
                        loading={loading}
                        disabled={code.length !== 6}
                        style={{ width: '100%' }}
                    >
                        Verify
                    </Button>

                    <Button
                        variant="subtle"
                        onClick={() => setShowRecoveryInput(true)}
                        style={{ width: '100%' }}
                    >
                        Use a recovery code instead
                    </Button>
                </>
            ) : (
                <>
                    <TextInput
                        placeholder="Enter recovery code"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                        autoFocus
                        style={{ width: '100%' }}
                    />

                    <Checkbox
                        label="Remember this device for 30 days"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.currentTarget.checked)}
                        style={{ width: '100%' }}
                    />

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        onClick={handleRecoveryVerify}
                        loading={loading}
                        style={{ width: '100%' }}
                    >
                        Verify with Recovery Code
                    </Button>

                    <Button
                        variant="subtle"
                        onClick={() => {
                            setShowRecoveryInput(false);
                            setRecoveryCode('');
                            setError('');
                        }}
                        style={{ width: '100%' }}
                    >
                        Back to authenticator code
                    </Button>
                </>
            )}

            <Button variant="subtle" color="gray" onClick={onCancel}>
                Cancel
            </Button>
        </Stack>
    );
}
