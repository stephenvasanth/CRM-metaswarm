import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  password?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
}

export interface UpdateUserRequest {
  role?: 'USER' | 'ADMIN';
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateMe(req: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, req);
  }

  getAll(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.apiUrl);
  }

  createUser(req: CreateUserRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.apiUrl, req);
  }

  updateUser(id: number, req: UpdateUserRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/${id}`, req);
  }
}
