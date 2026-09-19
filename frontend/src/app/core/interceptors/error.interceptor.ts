import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ErrorResponse } from '../models/api-response.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/components/toast.service';

/**
 * Normalizes backend error envelopes ({ success:false, message, error }) into a
 * plain human-readable message, surfaces it via ToastService, and redirects to
 * /login on a 401 (expired/invalid token). Never leaks stack traces or raw
 * MongoDB/Neo4j errors — the backend's own error handler already keeps those out
 * of the response body, so this only ever forwards `message`.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const body = error.error as ErrorResponse | undefined;
        const message =
          body && typeof body.message === 'string'
            ? body.message
            : 'Something went wrong while contacting the server.';

        if (error.status === 401) {
          auth.logout();
          toast.show(message, 'error');
          router.navigate(['/login']);
        } else if (error.status === 0) {
          toast.show('Cannot reach the server. Check your connection and try again.', 'error');
        } else {
          toast.show(message, 'error');
        }
      }
      return throwError(() => error);
    }),
  );
};
