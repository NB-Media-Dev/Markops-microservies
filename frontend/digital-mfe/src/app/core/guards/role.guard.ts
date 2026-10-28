import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ROLE_DEFAULT_ROUTES, hasModuleAccess } from '../services/auth.service';
import { UserRole } from '../models/auth.model';


export const roleGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureInitialized();

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;


  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }


  const userRole = String(currentUser.role || '').toUpperCase().replace(/[\s-]/g, '_');
  const normalizedUserRole = userRole === 'ADMIN' ? 'ADMINISTRATOR' : userRole;
  const isAllowed = allowedRoles.some((r) => {
    const norm = String(r).toUpperCase().replace(/[\s-]/g, '_');
    return norm === normalizedUserRole || (norm === 'ADMINISTRATOR' && normalizedUserRole === 'ADMIN');
  });

  if (isAllowed) {
    return true;
  }

  const fallbackRoute = '/campaigns';
  return router.createUrlTree([fallbackRoute]);
};
