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

  private readonly _currentUser = signal<User | null>({
    id: '1',
    email: 'admin@markops.io',
    fullName: 'System Administrator',
    role: 'ADMINISTRATOR',
    department: 'Executive Operations',
    isActive: true,
  });

  readonly currentUser = computed(() => this._currentUser());

  constructor() {
    if (this.isBrowser) {
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
            fullName: user.fullName || user.name,
            role: user.role || user.roleId || 'ADMINISTRATOR',
            department: user.department || 'Executive Operations',
            avatarUrl: user.avatarUrl || user.avatar_image,
            isActive: Boolean(user.isActive),
          });
        }
      }
    } catch {
      // Keep session fallback
    }
  }
}

