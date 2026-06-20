import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
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

  function runGuard(): boolean | Promise<boolean> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean;
  }

  it('should return true when token exists', () => {
    localStorage.setItem('jwt_token', 'valid-token');

    const result = runGuard();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to /login and return false when no token', () => {
    localStorage.removeItem('jwt_token');

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return false for null token', () => {
    localStorage.removeItem('jwt_token');

    const result = runGuard();

    expect(result).toBeFalse();
  });
});
