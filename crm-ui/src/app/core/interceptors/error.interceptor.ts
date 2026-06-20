import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Error interceptor — handles global HTTP errors.
 * On 401/403: clears JWT token and redirects to /login.
 * Other errors are passed through for feature-level handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('jwt_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
