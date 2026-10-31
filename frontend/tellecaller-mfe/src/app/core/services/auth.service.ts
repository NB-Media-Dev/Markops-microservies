import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/auth.model';
import { getAuthToken } from '../utils/api-url.utils';
import { redirectToHostLogin } from '../config/mfe.config';

export const ROLE_DEFAULT_ROUTES: Partial<Record<UserRole, string>> = {
  ADMINISTRATOR: '/telecalling',
  TELECALLER: '/telecalling',
};

export const DEMO_ACCOUNTS: Record<string, { email: string; user: User }> = {
  TELECALLER: {
    email: 'priya@markops.io',
    user: {
      id: 'tc-1',
      email: 'priya@markops.io',
      fullName: 'Priya Sharma',
      role: 'TELECALLER',
      department: 'Telecalling',
      isActive: true,
    },
  },
  ADMINISTRATOR: {
    email: 'admin@markops.io',
    user: {
      id: '1',
      email: 'admin@markops.io',
      fullName: 'System Administrator',
      role: 'ADMINISTRATOR',
      department: 'Executive Operations',
      isActive: true,
    },
  },
};

/**
 * Session service for tellecaller-mfe. Reads the host session from storage/cookies,
 * handles postMessage synchronization when embedded in an iframe, and provides
 * safe fallback for standalone development (port 4205).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _currentUser = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _isInitialized = signal(false);

  readonly currentUser = computed(() => this._currentUser());
  readonly accessToken = computed(() => this._accessToken());
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this._accessToken());
  readonly isInitialized = computed(() => this._isInitialized());

  constructor() {
    if (this.isBrowser) {
      // Clean up recursive /login?returnUrl loop parameter from address bar if present
      try {
        if (window.location.search.includes('returnUrl=') || window.location.pathname.startsWith('/login')) {
          console.log('[Auth] Clearing loop URL parameters from address bar');
          window.history.replaceState({}, document.title, window.location.pathname.replace(/^\/login/, '') || '/');
        }
      } catch (e) {
        console.log('[Auth URL Cleanup]:', e);
      }

      // Check query parameters for token/user
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qToken = urlParams.get('token');
        const qUser = urlParams.get('user');
        if (qToken) {
          let userObj: User | null = null;
          if (qUser) {
            try {
              userObj = JSON.parse(decodeURIComponent(qUser));
            } catch (e) {
              console.log('[Auth URL Param Error]:', e);
            }
          }
          userObj ??= this.parseJwt(qToken);
          if (userObj) {
            this.setSession(userObj, qToken);
          }
        }
      } catch (err) {
        console.log('[Auth URL Check]:', err);
      }

      // Listen for host postMessage events
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'MARKOPS_AUTH_UPDATE') {
          const token = event.data.token || getAuthToken() || 'mo_jwt_default';
          const user = event.data.user || this.parseJwt(token) || DEMO_ACCOUNTS['ADMINISTRATOR'].user;
          this.setSession(user, token);
        }
      });

      // Request auth from parent shell if in iframe
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'MARKOPS_REQUEST_AUTH' }, '*');
      }
    }

    this.readHostSession();
  }

  async ensureInitialized(): Promise<boolean> {
    if (!this._isInitialized()) this.readHostSession();
    return this.isAuthenticated();
  }

  setSession(user: User, token = 'mo_jwt_default'): void {
    const rawRole = String((user as any).roleName || user.role || 'ADMINISTRATOR').toUpperCase();
    const normalizedRole = (rawRole === 'ADMIN' ? 'ADMINISTRATOR' : rawRole) as UserRole;
    const activeUser: User = { ...user, role: normalizedRole, isActive: user.isActive !== false };
    this._currentUser.set(activeUser);
    this._accessToken.set(token);
    this._isInitialized.set(true);

    if (this.isBrowser) {
      try {
        localStorage.setItem('markops_token', token);
        localStorage.setItem('markops_user', JSON.stringify(activeUser));
      } catch (e) {
        console.log('[Auth Storage Notice]:', e);
      }
    }
  }

  /** Re-read the host's session (e.g. after the host refreshed the token). */
  readHostSession(): void {
    if (!this.isBrowser) {
      this._isInitialized.set(true);
      return;
    }
    const token = getAuthToken();
    this._accessToken.set(token);
    this._currentUser.set(token ? this.loadUser(token) : null);
    this._isInitialized.set(true);
  }

  /** Called by the HTTP interceptor on 401: hand control back to the host login. */
  handleUnauthorized(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    redirectToHostLogin('sessionExpired');
  }

  logout(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    redirectToHostLogin('loggedOut');
  }

  private loadUser(token: string): User | null {
    try {
      const raw = localStorage.getItem('markops_user');
      if (raw) return JSON.parse(raw) as User;
    } catch {
      /* storage unavailable - fall back to the token payload */
    }
    return this.parseJwt(token);
  }

  private parseJwt(token: string): User | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const p = JSON.parse(atob(part.replaceAll('-', '+').replaceAll('_', '/')));
      if (!p?.sub || !p?.role) return null;
      return {
        id: String(p.sub),
        email: p.email ?? '',
        fullName: p.fullName ?? p.name ?? '',
        role: p.role,
        department: p.department,
        isActive: p.isActive !== false,
      };
    } catch {
      return null;
    }
  }
}
