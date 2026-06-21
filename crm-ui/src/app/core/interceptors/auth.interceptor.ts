import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth interceptor — attaches JWT token to outgoing requests.
 * Reads token from localStorage and adds Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
