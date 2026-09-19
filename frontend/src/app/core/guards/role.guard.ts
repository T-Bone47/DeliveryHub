import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/enums.model';
import { AuthService } from '../services/auth.service';

/**
 * Usage in routes: canActivate: [roleGuard(['ADMIN'])]
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.role() && allowedRoles.includes(auth.role()!)) {
      return true;
    }

    return router.createUrlTree(['/access-restricted']);
  };
}
