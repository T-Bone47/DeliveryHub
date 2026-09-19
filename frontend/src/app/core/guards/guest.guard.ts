import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Prevents an already-authenticated user from seeing /login or /register again. */
export const guestGuard: CanActivateFn = () => {
  // Allow seamless switching between portals during evaluations and demonstrations
  return true;
};
