import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

/**
 * AuthService stub — real implementation in WU-05.
 * Provides current user state and logout functionality.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser$ = new BehaviorSubject<User | null>(null);
  isAdmin$ = this.currentUser$.pipe(map((u) => u?.role === 'ADMIN'));

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.currentUser$.next(null);
  }
}
