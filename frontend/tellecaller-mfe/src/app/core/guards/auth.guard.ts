import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { redirectToHostLogin } from '../config/mfe.config';

/** Lets the user in only when the host has left a valid session. No login page here. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ensureInitialized();
  if (auth.isAuthenticated() && auth.currentUser()?.isActive !== false) return true;
  redirectToHostLogin();
  return false;
};
