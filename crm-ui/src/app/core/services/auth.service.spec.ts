import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

const mockLoginResponse = {
  token: 'mock-jwt-token',
  user: {
    id: 1,
    email: 'admin@crm.local',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize currentUser$ to null when no stored user', (done) => {
    service.currentUser$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('should rehydrate currentUser$ from localStorage on construction', () => {
    const stored = { id: '1', email: 'test@test.com', name: 'Test User', role: 'USER' as const };
    localStorage.setItem('crm_user', JSON.stringify(stored));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const freshService = TestBed.inject(AuthService);
    TestBed.inject(HttpTestingController);
    expect(freshService.currentUser$.value).toEqual(stored);
  });

  it('should return null from currentUser$ when localStorage user is corrupt', () => {
    localStorage.setItem('crm_user', 'not-valid-json{{{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const freshService = TestBed.inject(AuthService);
    TestBed.inject(HttpTestingController);
    expect(freshService.currentUser$.value).toBeNull();
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

  describe('login()', () => {
    it('should POST to /api/auth/login with credentials', () => {
      service.login('admin@crm.local', 'Admin1234!').subscribe();
      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@crm.local', password: 'Admin1234!' });
      req.flush(mockLoginResponse);
    });

    it('should store token in localStorage on success', (done) => {
      service.login('admin@crm.local', 'Admin1234!').subscribe(() => {
        expect(localStorage.getItem('jwt_token')).toBe('mock-jwt-token');
        done();
      });
      httpMock.expectOne('/api/auth/login').flush(mockLoginResponse);
    });

    it('should set currentUser$ with mapped user on success', (done) => {
      service.login('admin@crm.local', 'Admin1234!').subscribe(() => {
        const user = service.currentUser$.value;
        expect(user).toEqual({
          id: '1',
          email: 'admin@crm.local',
          name: 'Admin User',
          role: 'ADMIN',
        });
        done();
      });
      httpMock.expectOne('/api/auth/login').flush(mockLoginResponse);
    });

    it('should store user in localStorage on success', (done) => {
      service.login('admin@crm.local', 'Admin1234!').subscribe(() => {
        const stored = JSON.parse(localStorage.getItem('crm_user')!);
        expect(stored.email).toBe('admin@crm.local');
        expect(stored.name).toBe('Admin User');
        done();
      });
      httpMock.expectOne('/api/auth/login').flush(mockLoginResponse);
    });

    it('should propagate HTTP error on login failure', (done) => {
      service.login('bad@email.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          done();
        },
      });
      httpMock.expectOne('/api/auth/login').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout()', () => {
    it('should remove jwt_token from localStorage', () => {
      localStorage.setItem('jwt_token', 'test-token');
      service.logout();
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('should remove crm_user from localStorage', () => {
      localStorage.setItem('crm_user', '{}');
      service.logout();
      expect(localStorage.getItem('crm_user')).toBeNull();
    });

    it('should set currentUser$ to null', (done) => {
      service.currentUser$.next({ id: '1', email: 'user@test.com', name: 'User', role: 'USER' });
      service.logout();
      service.currentUser$.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('isLoggedIn()', () => {
    it('should return false when no token in localStorage', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true when token exists in localStorage', () => {
      localStorage.setItem('jwt_token', 'some-token');
      expect(service.isLoggedIn()).toBeTrue();
    });
  });
});
