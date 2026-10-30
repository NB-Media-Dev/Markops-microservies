import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/auth.model';
import { safeFetch, getAuthToken } from '../utils/api-url.utils';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _currentUser = signal<User | null>(null);

  readonly currentUser = computed(() => this._currentUser());

  constructor() {
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem('markops_user') || sessionStorage.getItem('markops_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email) {
            this._currentUser.set(parsed);
          }
        }
      } catch {}

      window.addEventListener('message', (event) => {
        if (event.data?.type === 'MARKOPS_AUTH_UPDATE' && event.data.user) {
          this._currentUser.set(event.data.user);
        }
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'MARKOPS_REQUEST_AUTH' }, '*');
      }

      setTimeout(() => {
        void this.fetchProfile();
      }, 0);
    }
  }

  async fetchProfile(): Promise<void> {
    try {
      const res = await safeFetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json();
        const user = body.data || body.user || body;
        if (user && user.email) {
          this._currentUser.set({
            id: String(user.id),
            email: user.email,
            fullName: user.fullName || user.name || 'User',
            role: user.role || user.roleId || 'ADMINISTRATOR',
            department: user.department || user.roleName || user.role || 'Operations',
            avatarUrl: user.avatarUrl || user.avatar_image,
            isActive: Boolean(user.isActive),
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  logout(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem('markops_token');
        localStorage.removeItem('markops_user');
        sessionStorage.removeItem('markops_token');
        sessionStorage.removeItem('markops_user');
      } catch {}
    }
    this._currentUser.set(null);
  }
}

