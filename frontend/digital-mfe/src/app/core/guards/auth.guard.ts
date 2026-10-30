import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService, DEMO_ACCOUNTS } from '../services/auth.service';
import { getAuthToken } from '../utils/api-url.utils';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);

  await authService.ensureInitialized();

  if (authService.isAuthenticated()) {
    return true;
  }

  const token = getAuthToken();
  if (token) {
    return true;
  }

  // If embedded in shell iframe, allow child to load so parent can postMessage auth
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    return true;
  }

  // Standalone fallback: initialize default session so module runs immediately
  authService.setSession(DEMO_ACCOUNTS['ADMINISTRATOR'].user, 'mo_jwt_default');
  return true;
};
