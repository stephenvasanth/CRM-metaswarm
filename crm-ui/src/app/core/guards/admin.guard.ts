import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Admin guard — protects admin-only routes.
 * Decodes JWT payload (base64 middle segment) to check role.
 * Redirects to /dashboard if not ADMIN.
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    router.navigate(['/dashboard']);
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      router.navigate(['/dashboard']);
      return false;
    }

    // Decode base64url middle segment (payload)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
    };

    if (payload.role === 'ADMIN') {
      return true;
    }
  } catch {
    // Invalid token format
  }

  router.navigate(['/dashboard']);
  return false;
};
