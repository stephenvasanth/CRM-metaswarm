import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Helper to create a valid JWT with a given payload (unsigned, for testing)
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('adminGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    localStorage.removeItem('jwt_token');
  });

  function runGuard(): boolean {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean;
  }

  it('should return true when JWT payload contains role ADMIN', () => {
    localStorage.setItem('jwt_token', makeJwt({ role: 'ADMIN', sub: 'user1' }));

    const result = runGuard();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to /dashboard and return false for USER role', () => {
    localStorage.setItem('jwt_token', makeJwt({ role: 'USER', sub: 'user2' }));

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /dashboard and return false when no token', () => {
    localStorage.removeItem('jwt_token');

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /dashboard and return false for malformed token', () => {
    localStorage.setItem('jwt_token', 'not-a-valid-jwt');

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /dashboard when role is missing from payload', () => {
    localStorage.setItem('jwt_token', makeJwt({ sub: 'user3' }));

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /dashboard for invalid base64 payload', () => {
    localStorage.setItem('jwt_token', 'header.!!!invalid!!!.sig');

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
