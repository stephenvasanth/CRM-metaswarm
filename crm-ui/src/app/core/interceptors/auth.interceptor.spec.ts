import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt_token');
  });

  it('should attach Authorization header when token exists', () => {
    localStorage.setItem('jwt_token', 'test-token-123');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush({});
  });

  it('should NOT attach Authorization header when no token', () => {
    localStorage.removeItem('jwt_token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should pass request through unchanged without token', () => {
    localStorage.removeItem('jwt_token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.url).toBe('/api/test');
    req.flush({});
  });
});
