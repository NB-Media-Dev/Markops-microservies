import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/auth.model';
import { getAuthToken } from '../utils/api-url.utils';
import { redirectToHostLogin } from '../config/mfe.config';

export const ROLE_DEFAULT_ROUTES: Partial<Record<UserRole, string>> = {
  ADMINISTRATOR: '/telecalling',
  TELECALLER: '/telecalling',
};

/**
 * Session-only service. It does NOT log anyone in: the host application signs the
 * user in and leaves `markops_token` / `markops_user` in storage (or the token in
 * the `markops_token` cookie). This service just reads that session.
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
    this.readHostSession();
  }

  async ensureInitialized(): Promise<boolean> {
    if (!this._isInitialized()) this.readHostSession();
    return this.isAuthenticated();
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
