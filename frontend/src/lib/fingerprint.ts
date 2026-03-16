const FINGERPRINT_KEY = 'device_fingerprint';

export async function getDeviceFingerprint(): Promise<string> {
  const stored = localStorage.getItem(FINGERPRINT_KEY);
  if (stored) {
    return stored;
  }

  const fingerprint = await generateFingerprint();
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

async function generateFingerprint(): Promise<string> {
  const data = {
    userAgent: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
  };

  const msgBuffer = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera')) return 'Opera';
  
  return 'Unknown Browser';
}

export function clearDeviceFingerprint(): void {
  localStorage.removeItem(FINGERPRINT_KEY);
}
