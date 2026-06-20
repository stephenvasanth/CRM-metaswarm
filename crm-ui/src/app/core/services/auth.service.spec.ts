import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.removeItem('jwt_token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have currentUser$ initialized to null', (done) => {
    service.currentUser$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('should have isAdmin$ as false when no user', (done) => {
    service.isAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBeFalse();
      done();
    });
  });

  it('should have isAdmin$ as false for USER role', (done) => {
    service.currentUser$.next({ id: '1', email: 'user@test.com', name: 'User', role: 'USER' });
    service.isAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBeFalse();
      done();
    });
  });

  it('should have isAdmin$ as true for ADMIN role', (done) => {
    service.currentUser$.next({ id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' });
    service.isAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBeTrue();
      done();
    });
  });

  it('should clear jwt_token on logout()', () => {
    localStorage.setItem('jwt_token', 'test-token');
    service.logout();
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  it('should set currentUser$ to null on logout()', (done) => {
    service.currentUser$.next({ id: '1', email: 'user@test.com', name: 'User', role: 'USER' });
    service.logout();

    service.currentUser$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });
});
