import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  UserService,
  UserProfile,
  UpdateProfileRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: UserProfile = {
    id: 1,
    email: 'admin@crm.local',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMe()', () => {
    it('should GET /api/users/me and return the profile', () => {
      service.getMe().subscribe((u) => expect(u).toEqual(mockUser));
      const req = httpMock.expectOne('/api/users/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('updateMe()', () => {
    it('should PUT /api/users/me with firstName and lastName', () => {
      const body: UpdateProfileRequest = { firstName: 'New', lastName: 'Name' };
      service.updateMe(body).subscribe((u) => expect(u).toEqual(mockUser));
      const req = httpMock.expectOne('/api/users/me');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(mockUser);
    });

    it('should include password in body when provided', () => {
      const body: UpdateProfileRequest = { firstName: 'New', lastName: 'Name', password: 'Secure123!' };
      service.updateMe(body).subscribe();
      const req = httpMock.expectOne('/api/users/me');
      expect(req.request.body.password).toBe('Secure123!');
      req.flush(mockUser);
    });
  });

  describe('getAll()', () => {
    it('should GET /api/users and return user list', () => {
      service.getAll().subscribe((users) => expect(users).toEqual([mockUser]));
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });
  });

  describe('createUser()', () => {
    it('should POST /api/users with full create request body', () => {
      const body: CreateUserRequest = {
        email: 'new@crm.local',
        password: 'Password1!',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
      };
      service.createUser(body).subscribe((u) => expect(u).toEqual(mockUser));
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockUser);
    });
  });

  describe('updateUser()', () => {
    it('should PATCH /api/users/:id with active flag', () => {
      const body: UpdateUserRequest = { active: false };
      service.updateUser(1, body).subscribe((u) => expect(u).toEqual(mockUser));
      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(mockUser);
    });

    it('should PATCH /api/users/:id with role', () => {
      const body: UpdateUserRequest = { role: 'ADMIN' };
      service.updateUser(2, body).subscribe();
      const req = httpMock.expectOne('/api/users/2');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.role).toBe('ADMIN');
      req.flush(mockUser);
    });
  });
});
