import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService, DEMO_ACCOUNTS } from '../services/auth.service';
import { getAuthToken } from '../utils/api-url.utils';
import { redirectToHostLogin } from '../config/mfe.config';

/** Lets the user in when host has session, or provides standalone fallback for direct development on port 4205. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ensureInitialized();

  if (auth.isAuthenticated() && auth.currentUser()?.isActive !== false) {
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

  // Standalone fallback: when running standalone (port 4205 / direct development), initialize default session
  if (typeof window !== 'undefined' && (window.location.port === '4205' || !window.location.port)) {
    console.log('[tellecaller-mfe] Standalone dev mode: initializing default session');
    auth.setSession(DEMO_ACCOUNTS['ADMINISTRATOR'].user, 'mo_jwt_default');
    return true;
  }

  // Guard against redirect loop if already at login
  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/login') || window.location.search.includes('returnUrl='))) {
    return true;
  }

  redirectToHostLogin();
  return false;
};
