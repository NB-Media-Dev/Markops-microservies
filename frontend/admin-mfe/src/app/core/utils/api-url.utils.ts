declare const process: any;

export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    let savedApiUrl: string | null = null;
    try {
      savedApiUrl = localStorage.getItem('admin_backend_url') || localStorage.getItem('markops_backend_url');
    } catch { }

    const injectedUrl =
      (window as any).__ADMIN_API_URL__ ||
      (window as any).__API_URL__ ||
      (window as any).process?.env?.ADMIN_BACKEND_URL ||
      savedApiUrl;
    if (injectedUrl) return injectedUrl.replace(/\/$/, '');

    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    const port = window.location.port;

    if (hostname.includes('onrender.com')) {
      return window.location.origin;
    }

    const isDevPort = port === '4200' || port === '4201' || port === '4202' || port === '4203';
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (port !== '4000' && (isDevPort || isLocalHost)) {
      return `${protocol}//${hostname}:4000`;
    }

    return window.location.origin;
  }

  const port = (typeof process !== 'undefined' && process.env && process.env['PORT']) || '4000';
  return `http://localhost:${port}`.replace(/\/$/, '');
}

export function getApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('markops_token') ||
      sessionStorage.getItem('auth_token')
    );
  } catch {
    return null;
  }
}

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  const fullUrl = getApiUrl(url);
  const token = getAuthToken();

  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(fullUrl, {
    ...init,
    headers,
    credentials: 'omit',
  });
}

