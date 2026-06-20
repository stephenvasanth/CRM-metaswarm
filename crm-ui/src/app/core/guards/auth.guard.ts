import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Auth guard — protects routes that require authentication.
 * Checks for JWT token in localStorage.
 * Redirects to /login if not authenticated.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
