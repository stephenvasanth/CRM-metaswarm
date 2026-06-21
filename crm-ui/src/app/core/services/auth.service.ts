import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN';
    active: boolean;
  };
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'crm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  currentUser$ = new BehaviorSubject<User | null>(this.loadStoredUser());
  isAdmin$ = this.currentUser$.pipe(map((u) => u?.role === 'ADMIN'));

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const user: User = {
          id: String(res.user.id),
          email: res.user.email,
          name: `${res.user.firstName} ${res.user.lastName}`.trim(),
          role: res.user.role,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser$.next(user);
      }),
      map(() => undefined),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}
