/**
 * Runtime settings for the micro-frontend. The host app may override them by
 * setting `window.__TELLECALLER_MFE__ = { hostLoginUrl: '...' }` before bootstrap.
 */
export interface MfeConfig {
  /** Where to send the user when there is no valid session (host owns login). */
  hostLoginUrl: string;
}

const DEFAULTS: MfeConfig = { hostLoginUrl: '/login' };

export function getMfeConfig(): MfeConfig {
  const override = typeof window !== 'undefined' ? (window as any).__TELLECALLER_MFE__ : undefined;
  return { ...DEFAULTS, ...(override ?? {}) };
}

export function redirectToHostLogin(reason?: string): void {
  if (typeof window === 'undefined') return;
  const { hostLoginUrl } = getMfeConfig();
  const sep = hostLoginUrl.includes('?') ? '&' : '?';
  const returnUrl = encodeURIComponent(window.location.href);
  const tail = reason ? `&reason=${encodeURIComponent(reason)}` : '';
  window.location.assign(`${hostLoginUrl}${sep}returnUrl=${returnUrl}${tail}`);
}
