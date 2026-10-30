import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ROLE_DEFAULT_ROUTES } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();

  const user = auth.currentUser();
  if (!user) return false;

  const allowed = route.data?.['roles'] as UserRole[] | undefined;
  if (!allowed?.length || allowed.includes(user.role)) return true;

  const fallback = ROLE_DEFAULT_ROUTES[user.role];
  return fallback ? router.createUrlTree([fallback]) : false;
};
