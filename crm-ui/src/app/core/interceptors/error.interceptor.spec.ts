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
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt_token');
  });

  it('should clear token and navigate to /login on 401', (done) => {
    localStorage.setItem('jwt_token', 'some-token');

    http.get('/api/protected').subscribe({
      error: () => {
        expect(localStorage.getItem('jwt_token')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should clear token and navigate to /login on 403', (done) => {
    localStorage.setItem('jwt_token', 'some-token');

    http.get('/api/admin').subscribe({
      error: () => {
        expect(localStorage.getItem('jwt_token')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/admin');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('should NOT navigate or clear token on other errors (e.g., 500)', (done) => {
    localStorage.setItem('jwt_token', 'some-token');

    http.get('/api/data').subscribe({
      error: () => {
        expect(localStorage.getItem('jwt_token')).toBe('some-token');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should pass through the error for caller to handle', (done) => {
    http.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(404);
        done();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });
});
