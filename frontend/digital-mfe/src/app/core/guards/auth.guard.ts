import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, hasModuleAccess } from '../services/auth.service';


export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

 
  await authService.ensureInitialized();

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    if (user?.isActive === false) {
      authService.logout();
      return router.createUrlTree(['/login'], { queryParams: { error: 'inactive' } });
    }
    if (!hasModuleAccess(user?.role)) {
      authService.logout();
      return router.createUrlTree(['/login'], { queryParams: { error: 'unauthorized' } });
    }
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
