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

  // Prevent recursive redirect loop
  if (window.location.pathname.startsWith('/login') || window.location.search.includes('returnUrl=')) {
    console.warn('[tellecaller-mfe] Redirect loop prevented. Already at login or returnUrl detected.');
    return;
  }

  const { hostLoginUrl } = getMfeConfig();
  let targetUrl = hostLoginUrl;

  // If running standalone on port 4205, redirect to shell host on port 4200
  if (window.location.port === '4205' && hostLoginUrl.startsWith('/')) {
    targetUrl = `http://localhost:4200${hostLoginUrl}`;
  }

  const sep = targetUrl.includes('?') ? '&' : '?';
  // Use origin + pathname only to prevent query parameter explosion
  const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
  const tail = reason ? `&reason=${encodeURIComponent(reason)}` : '';
  window.location.assign(`${targetUrl}${sep}returnUrl=${returnUrl}${tail}`);
}
